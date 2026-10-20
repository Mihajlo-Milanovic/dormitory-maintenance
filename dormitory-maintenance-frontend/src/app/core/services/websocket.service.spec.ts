import { BehaviorSubject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { mapNotification } from '../../shared/models/notification.mapper';
import { WebSocketService } from './websocket.service';

const mocks = vi.hoisted(() => ({
  io: vi.fn(),
  socket: {
    on: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), removeAllListeners: vi.fn(),
  },
}));
vi.mock('socket.io-client', () => ({ io: mocks.io }));

describe('WebSocketService', () => {
  let service: WebSocketService;
  let tokens: BehaviorSubject<string | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.io.mockReturnValue(mocks.socket);
    tokens = new BehaviorSubject<string | null>('test-token');
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { accessToken$: tokens.asObservable() } }],
    });
    service = TestBed.inject(WebSocketService);
  });

  it('uses the gateway namespace, transport path and handshake auth once', () => {
    service.connect();
    service.connect();
    expect(mocks.io).toHaveBeenCalledExactlyOnceWith(`${window.location.origin}/ws`, {
      path: '/ws/socket.io', auth: { token: 'test-token' }, autoConnect: false,
      reconnectionAttempts: 5, reconnectionDelay: 1000, reconnectionDelayMax: 10000,
    });
    expect(mocks.socket.connect).toHaveBeenCalledOnce();
  });

  it('forwards supported persisted events and ignores malformed payloads and connection errors', () => {
    const receive = vi.fn();
    service.onMessage().subscribe(receive);
    service.connect();
    const listener = mocks.socket.on.mock.calls.find(([name]) => name === 'report.created')![1];
    listener(null);
    listener({ id: 'domain-update' });
    listener({ id: '1', type: 'report.updated' });
    listener({ id: '1', type: 'report.created', title: 42 });
    const event = { id: '1', userId: 'a', type: 'report.created', payload: { message: 'Reported' }, readAt: null, createdAt: '2026-10-20T00:00:00Z' };
    listener(event);
    const errorListener = mocks.socket.on.mock.calls.find(([name]) => name === 'connect_error')![1];
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorListener(new Error('offline'));
    log.mockRestore();
    expect(receive).toHaveBeenCalledExactlyOnceWith(mapNotification(event));
    expect(mocks.socket.on.mock.calls.map(([name]) => name)).toEqual([
      'report.created', 'report.updated', 'supply.updated', 'job.reassigned', 'connect', 'auth.rejected', 'connect_error',
    ]);
  });

  it('signals every successful connection for offline recovery', () => {
    const connected = vi.fn();
    service.onConnected().subscribe(connected);
    service.connect();
    const listener = mocks.socket.on.mock.calls.find(([name]) => name === 'connect')![1];
    listener();
    listener();
    expect(connected).toHaveBeenCalledTimes(2);
  });

  it('does not connect without credentials', () => {
    tokens.next(null);
    service.connect();
    expect(mocks.io).not.toHaveBeenCalled();
  });

  it('replaces the connection when credentials change and ignores changes after disconnect', () => {
    service.connect();
    tokens.next('new-token');
    expect(mocks.io).toHaveBeenCalledTimes(2);
    expect(mocks.io.mock.calls[1][1].auth).toEqual({ token: 'new-token' });
    service.disconnect();
    tokens.next('after-logout');
    expect(mocks.io).toHaveBeenCalledTimes(2);
  });

  it('stops on authentication rejection until credentials change', () => {
    service.connect();
    const reject = mocks.socket.on.mock.calls.find(([name]) => name === 'auth.rejected')![1];
    reject();
    expect(mocks.socket.disconnect).toHaveBeenCalledOnce();
    tokens.next('test-token');
    service.connect();
    expect(mocks.io).toHaveBeenCalledOnce();
    tokens.next('replacement');
    expect(mocks.io).toHaveBeenCalledTimes(2);
  });

  it('removes listeners and disconnects before allowing a fresh client', () => {
    service.connect();
    service.disconnect();
    service.disconnect();
    expect(mocks.socket.removeAllListeners).toHaveBeenCalledOnce();
    expect(mocks.socket.disconnect).toHaveBeenCalledOnce();
    service.connect();
    expect(mocks.io).toHaveBeenCalledTimes(2);
  });
});
