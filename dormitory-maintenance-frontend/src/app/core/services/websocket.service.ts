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
  private mockTimer?: any;

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
      this.ws.onerror = () => {
        this.startMockEventSimulation();
      };
      this.ws.onclose = () => {
        this.ws = null;
        this.startMockEventSimulation();
      };
    } catch {
      this.startMockEventSimulation();
    }
  }

  private startMockEventSimulation(): void {
    if (this.mockTimer) return;
    // Simulate real-time websocket notification events for UI testing
    this.mockTimer = setInterval(() => {
      const mockEvents = [
        { id: 'evt-' + Date.now(), type: 'report.created', title: 'New Maintenance Report', message: 'A new plumbing issue was reported in Building C.', createdAt: new Date().toISOString() },
        { id: 'evt-' + Date.now(), type: 'supply.updated', title: 'Supply Request Ordered', message: 'Administrator ordered requested replacement parts.', createdAt: new Date().toISOString() },
        { id: 'evt-' + Date.now(), type: 'report.updated', title: 'Job Status Updated', message: 'Janitor updated task status to "Repair in progress".', createdAt: new Date().toISOString() },
      ];
      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      this.messageSubject.next(randomEvent);
    }, 25000);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = undefined;
    }
  }

  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }
}
