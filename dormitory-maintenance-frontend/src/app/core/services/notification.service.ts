import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { mapNotification } from '../../shared/models/notification.mapper';
import { AppNotification } from '../../shared/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly api = inject(ApiService);

  getNotifications(): Observable<AppNotification[]> {
    return this.api.get<unknown[]>('notifications').pipe(
      map((items) => items.map(mapNotification).filter((item) => item !== null)),
    );
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.api.patch<unknown>(`notifications/${id}/read`, {}).pipe(
      map((result) => {
        const notification = mapNotification(result);
        if (!notification) throw new Error('Invalid notification response');
        return notification;
      }),
    );
  }

  markAllAsRead(): Observable<AppNotification[]> {
    return this.getNotifications().pipe(
      switchMap((items) => {
        return items.length
          ? forkJoin(items.map((item) => item.isRead ? of(item) : this.markAsRead(item.id)))
          : of([]);
      }),
    );
  }
}
