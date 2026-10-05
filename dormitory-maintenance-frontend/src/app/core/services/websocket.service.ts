import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private ws: WebSocket | null = null;
  private readonly messageSubject = new Subject<any>();

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const token = this.authService.getAccessToken();
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${token || ''}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch {
          this.messageSubject.next(event.data);
        }
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      this.ws.onclose = () => {
        this.ws = null;
      };
    } catch (e) {
      console.error('Failed to connect WebSocket:', e);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }
}
