import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AppNotification } from '../../shared/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly api = inject(ApiService);

  getNotifications(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('notifications');
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.api.patch<AppNotification>(`notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.api.patch<any>('notifications/read-all', {});
  }
}
