import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated, selectCurrentUser, selectUserRole } from './features/auth/state/auth.selectors';
import { AuthActions } from './features/auth/state/auth.actions';
import { NotificationService } from './core/services/notification.service';
import { WebSocketService } from './core/services/websocket.service';
import { AppNotification } from './shared/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly notificationService = inject(NotificationService);
  private readonly webSocketService = inject(WebSocketService);
  private wsSub?: Subscription;

  protected readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  protected readonly currentUser$ = this.store.select(selectCurrentUser);
  protected readonly userRole$ = this.store.select(selectUserRole);

  protected notifications: AppNotification[] = [];
  protected showNotificationsDropdown = false;

  ngOnInit(): void {
    this.isAuthenticated$.subscribe((auth) => {
      if (auth) {
        this.webSocketService.connect();
        this.loadNotifications();
        this.wsSub = this.webSocketService.onMessage().subscribe((msg) => {
          if (msg && msg.type) {
            this.notifications = [
              {
                id: msg.id || Date.now().toString(),
                userId: msg.userId || '',
                title: msg.title || 'New Update',
                message: msg.message || JSON.stringify(msg),
                type: msg.type,
                isRead: false,
                createdAt: msg.createdAt || new Date().toISOString(),
              },
              ...this.notifications,
            ];
          }
        });
      } else {
        this.webSocketService.disconnect();
        if (this.wsSub) {
          this.wsSub.unsubscribe();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
      },
      error: () => {
        this.notifications = [];
      },
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  toggleNotificationsDropdown(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      },
      error: () => {
        this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      },
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
      },
      error: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
      },
    });
  }

  protected onLogout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
