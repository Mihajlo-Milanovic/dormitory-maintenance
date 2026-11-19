import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@app/app';
import { selectCurrentUser, selectIsAuthenticated } from '@components/auth/state/auth.selectors';
import { NotificationService } from '@services/notification.service';
import { WebSocketService } from '@services/websocket.service';
import { AppNotification } from '@models/notification.model';

class TestApp extends App {
  get items() {
    return this.notifications;
  }
  get dropdown() {
    return this.showNotificationsDropdown;
  }
  logout() {
    this.onLogout();
  }
}

describe('App notification lifecycle', () => {
  let app: TestApp;
  let authenticated: BehaviorSubject<boolean>;
  let user: BehaviorSubject<{ id: string } | null>;
  let connected: Subject<void>;
  let messages: Subject<AppNotification>;
  let readResult: Subject<AppNotification>;
  let readAllResult: Subject<AppNotification[]>;
  let requests: Subject<AppNotification[]>[];
  let connect: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  const event: AppNotification = {
    id: '1',
    userId: 'a',
    type: 'report.created',
    title: 'Report',
    message: 'Created',
    isRead: false,
    createdAt: '2026-10-20T00:00:00Z',
  };

  beforeEach(() => {
    authenticated = new BehaviorSubject(true);
    user = new BehaviorSubject<{ id: string } | null>({ id: 'a' });
    messages = new Subject();
    connected = new Subject();
    requests = [];
    readResult = new Subject();
    readAllResult = new Subject();
    connect = vi.fn();
    disconnect = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Store,
          useValue: {
            select: (selector: unknown) =>
              selector === selectIsAuthenticated
                ? authenticated
                : selector === selectCurrentUser
                  ? user
                  : new BehaviorSubject('student'),
            dispatch: vi.fn(),
          },
        },
        {
          provide: WebSocketService,
          useValue: {
            connect,
            disconnect,
            onConnected: () => connected,
            onMessage: () => messages,
          },
        },
        {
          provide: NotificationService,
          useValue: {
            markAsRead: () => readResult,
            markAllAsRead: () => readAllResult,
            getNotifications: () => {
              const request = new Subject<AppNotification[]>();
              requests.push(request);
              return request;
            },
          },
        },
      ],
    });
    app = TestBed.runInInjectionContext(() => new TestApp());
    app.ngOnInit();
  });

  afterEach(() => app.ngOnDestroy());

  it('keeps one subscription across repeated auth state emissions', () => {
    authenticated.next(true);
    user.next({ id: 'a' });
    messages.next(event);
    expect(connect).toHaveBeenCalledOnce();
    expect(app.items).toHaveLength(1);
  });

  it('merges live events with refreshes, deduplicates and preserves read state', () => {
    messages.next(event);
    messages.next(event);
    requests[0].next([{ ...event, isRead: true }]);
    expect(app.items).toHaveLength(1);
    expect(app.items[0].isRead).toBe(true);
    connected.next();
    const missed = { ...event, id: 'missed', createdAt: '2026-10-21T00:00:00Z' };
    messages.next({ ...event, id: 'live', createdAt: '2026-10-22T00:00:00Z' });
    requests[1].next([event, missed]);
    messages.next(event);
    expect(app.items.map((item) => item.id)).toEqual(['live', 'missed', '1']);
    expect(app.items[2].isRead).toBe(true);
  });

  it('cancels stale refreshes and preserves notifications on refresh failure', () => {
    messages.next(event);
    connected.next();
    expect(requests[0].observed).toBe(false);
    requests[1].error(new Error('offline'));
    expect(app.items).toEqual([event]);
    messages.next({ ...event, userId: 'other', id: 'foreign' });
    expect(app.items).toEqual([event]);
  });

  it('uses persisted read results and does not mark notifications read on failure', () => {
    messages.next(event);
    app.markAsRead(event.id);
    readResult.error(new Error('failed'));
    expect(app.items[0].isRead).toBe(false);
    app.markAllAsRead();
    readAllResult.next([{ ...event, isRead: true }]);
    requests[0].next([event]);
    messages.next(event);
    expect(app.items[0].isRead).toBe(true);
  });

  it('refreshes after partial mark-all failure to recover persisted results', () => {
    messages.next(event);
    app.markAllAsRead();
    readAllResult.error(new Error('partial failure'));
    expect(requests).toHaveLength(2);
    requests[1].next([{ ...event, isRead: true }]);
    expect(app.items[0].isRead).toBe(true);
  });

  it('clears on logout and ignores outstanding HTTP responses and live events', () => {
    messages.next(event);
    app.toggleNotificationsDropdown();
    app.logout();
    requests[0].next([event]);
    messages.next(event);
    expect(app.items).toEqual([]);
    expect(app.dropdown).toBe(false);
    expect(requests[0].observed).toBe(false);
    expect(messages.observed).toBe(false);
    app.ngOnDestroy();
  });

  it('cancels the previous user session and disposes auth observation on destroy', () => {
    messages.next(event);
    user.next({ id: 'b' });
    requests[0].next([event]);
    expect(app.items).toEqual([]);
    expect(requests).toHaveLength(2);
    app.ngOnDestroy();
    authenticated.next(false);
    user.next({ id: 'c' });
    authenticated.next(true);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(messages.observed).toBe(false);
    expect(requests[1].observed).toBe(false);
  });
});
