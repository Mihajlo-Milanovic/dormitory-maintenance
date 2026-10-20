import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service';
import { mapNotification } from '../../shared/models/notification.mapper';

const notification = {
  id: '1', userId: 'a', type: 'report.updated', payload: { title: 'Tap', status: 'Finished' },
  createdAt: '2026-10-20T00:00:00Z', readAt: null,
};

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('maps HTTP notifications with the same mapper as live events and drops invalid rows', () => {
    const receive = vi.fn();
    service.getNotifications().subscribe(receive);
    http.expectOne('/api/notifications').flush([notification, { id: 'raw-report' }]);
    expect(receive).toHaveBeenCalledExactlyOnceWith([mapNotification(notification)]);
  });

  it('maps persisted read responses', () => {
    const receive = vi.fn();
    service.markAsRead('1').subscribe(receive);
    const request = http.expectOne('/api/notifications/1/read');
    expect(request.request.method).toBe('PATCH');
    const read = { ...notification, readAt: notification.createdAt };
    request.flush(read);
    expect(receive).toHaveBeenCalledExactlyOnceWith(mapNotification(read));
  });

  it('marks only unread notifications using existing backend endpoints', () => {
    const receive = vi.fn();
    service.markAllAsRead().subscribe(receive);
    http.expectOne('/api/notifications').flush([
      notification, { ...notification, id: '2', readAt: notification.createdAt },
    ]);
    const read = { ...notification, readAt: notification.createdAt };
    http.expectOne('/api/notifications/1/read').flush(read);
    expect(receive).toHaveBeenCalledExactlyOnceWith([mapNotification(read), mapNotification({ ...read, id: '2' })]);
  });

  it('completes mark-all for an empty list', () => {
    const receive = vi.fn();
    service.markAllAsRead().subscribe(receive);
    http.expectOne('/api/notifications').flush([]);
    expect(receive).toHaveBeenCalledExactlyOnceWith([]);
  });
});
