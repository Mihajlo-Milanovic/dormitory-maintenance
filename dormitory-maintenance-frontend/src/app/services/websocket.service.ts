import { Injectable, inject } from '@angular/core';
import { distinctUntilChanged, Observable, Subject, Subscription } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '@services/auth.service';
import { AppNotification } from '@models/notification.model';
import { mapNotification, notificationTypes } from '@models/notification.mapper';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private socket: Socket | null = null;
  private readonly connectedSubject = new Subject<void>();
  private readonly messageSubject = new Subject<AppNotification>();

  private tokenSub?: Subscription;
  private rejectedToken: string | null = null;

  connect(): void {
    if (this.tokenSub) return;
    this.tokenSub = this.authService.accessToken$
      .pipe(distinctUntilChanged())
      .subscribe((token) => {
        this.closeSocket();
        if (token && token !== this.rejectedToken) {
          this.rejectedToken = null;
          this.openSocket(token);
        } else if (!token) {
          this.rejectedToken = null;
        }
      });
  }

  private openSocket(token: string): void {
    const socket = io(`${window.location.origin}/ws`, {
      path: '/ws/socket.io',
      auth: { token },
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    this.socket = socket;

    for (const type of notificationTypes) {
      socket.on(type, (data: unknown) => {
        const notification = mapNotification(data);
        if (notification?.type === type) this.messageSubject.next(notification);
      });
    }
    socket.on('connect', () => this.connectedSubject.next());
    socket.on('auth.rejected', () => {
      this.rejectedToken = token;
      this.closeSocket();
    });
    socket.on('connect_error', (error: Error) => {
      console.error('Notification connection failed:', error.message);
    });
    socket.connect();
  }

  disconnect(): void {
    this.tokenSub?.unsubscribe();
    this.tokenSub = undefined;
    this.closeSocket();
  }

  private closeSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onConnected(): Observable<void> {
    return this.connectedSubject.asObservable();
  }

  onMessage(): Observable<AppNotification> {
    return this.messageSubject.asObservable();
  }
}
