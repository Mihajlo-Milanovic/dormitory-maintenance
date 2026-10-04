import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private socket$: Subject<any> | null = null;

  connect(): void {
    if (this.socket$) {
      return;
    }
    const token = this.authService.getAccessToken();
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${token || ''}`;

    // For initial scaffold/prototype, we can maintain a Subject or standard WebSocket wrapper
    // In later phases or actual production, RxJS webSocket can be utilized.
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  onMessage(): Observable<any> {
    if (!this.socket$) {
      this.socket$ = new Subject<any>();
    }
    return this.socket$.asObservable();
  }
}
