import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  // selectUserRole,
} from '@store/selectors/auth.selectors';
import { AuthActions } from '@store/actions/auth.actions';
import { AuthService } from '@services/auth.service';
import { NotificationService } from '@services/notification.service';
import { WebSocketService } from '@services/websocket.service';
import { mergeNotifications } from '@models/notification.mapper';
import { AppNotification } from '@models/notification.model';
import { combineLatest, distinctUntilChanged, map, Subscription, take } from 'rxjs';
import { MatRegistries, MatModules } from './core/ui/material-modules';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ...MatModules],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly router = inject(Router);
  private iconRegistry = inject(MatRegistries.MatIconRegistry);
  private authSub?: Subscription;
  private crossTabSub?: Subscription;
  private sessionSub = new Subscription();
  private refreshSub?: Subscription;

  protected readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  protected readonly currentUser$ = this.store.select(selectCurrentUser);
  //protected readonly userRole$ = this.store.select(selectUserRole);

  protected notifications: AppNotification[] = [];
  protected showNotificationsDropdown = false;

  ngOnInit(): void {
    this.iconRegistry.setDefaultFontSetClass('material-symbols-outlined');

    this.crossTabSub = this.authService.sessionEvents$.subscribe((event) => {
      if (event === 'logout') {
        this.authService.setAccessToken(null);
        this.store.dispatch(AuthActions.logoutSuccess());
        return;
      }

      if (event === 'login' && !this.authService.getAccessToken()) {
        this.authService
          .refreshToken()
          .pipe(take(1))
          .subscribe({
            next: (response) => {
              this.store.dispatch(AuthActions.loadCurrentUserSuccess(response.user));
              if (this.router.url.startsWith('/auth/login')) {
                this.router.navigate([`/${response.user.role}`]);
              }
            },
            error: () => {},
          });
      }
    });

    this.authSub = combineLatest([this.isAuthenticated$, this.currentUser$])
      .pipe(
        map(([auth, user]) => (auth ? (user?.id ?? null) : null)),
        distinctUntilChanged(),
      )
      .subscribe((userId) => {
        this.endNotificationSession();
        if (userId) {
          this.sessionSub = new Subscription();
          this.sessionSub.add(
            this.webSocketService.onMessage().subscribe((msg) => {
              if (msg.userId === userId) {
                this.notifications = mergeNotifications(this.notifications, [msg]);
              }
            }),
          );
          this.sessionSub.add(
            this.webSocketService.onConnected().subscribe(() => this.loadNotifications()),
          );
          this.loadNotifications();
          this.webSocketService.connect();
        }
      });
  }

  private endNotificationSession(): void {
    this.sessionSub.unsubscribe();
    this.webSocketService.disconnect();
    this.notifications = [];
    this.showNotificationsDropdown = false;
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.crossTabSub?.unsubscribe();
    this.endNotificationSession();
  }

  loadNotifications(): void {
    this.refreshSub?.unsubscribe();
    this.refreshSub = this.notificationService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = mergeNotifications(this.notifications, notifs);
      },
      // Preserve the current list when refresh fails; retry on the next connection.
      error: () => {},
    });
    this.sessionSub.add(this.refreshSub);
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  toggleNotificationsDropdown(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
  }

  markAsRead(id: string): void {
    this.sessionSub.add(
      this.notificationService.markAsRead(id).subscribe({
        next: (notification) => {
          this.notifications = mergeNotifications(this.notifications, [notification]);
        },
        error: () => {},
      }),
    );
  }

  markAllAsRead(): void {
    this.sessionSub.add(
      this.notificationService.markAllAsRead().subscribe({
        next: (notifications) => {
          this.notifications = mergeNotifications(this.notifications, notifications);
        },
        error: () => this.loadNotifications(),
      }),
    );
  }

  protected onLogout(): void {
    this.endNotificationSession();
    this.store.dispatch(AuthActions.logout());
  }
}
