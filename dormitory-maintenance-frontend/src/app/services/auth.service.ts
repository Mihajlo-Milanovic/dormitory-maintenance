import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, finalize, share, tap } from 'rxjs';
import { ApiService } from '@services/api.service';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '@models/auth.model';
import { User } from '@models/user.model';

export type AuthSessionEvent = 'login' | 'logout';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private accessToken: string | null = null;
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  readonly accessToken$ = this.tokenSubject.asObservable();

  private readonly sessionEventsSubject = new Subject<AuthSessionEvent>();
  readonly sessionEvents$ = this.sessionEventsSubject.asObservable();

  private readonly broadcastChannel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth-session') : null;
  private readonly instanceId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  // Caches the in-flight refresh call so concurrent 401s (several requests
  // failing at once) all await the SAME HTTP call instead of each firing
  // its own 'auth/refresh' request.
  private refreshInProgress$: Observable<RefreshTokenResponse> | null = null;

  constructor() {
    // Restore token from session storage on init if present
    const savedToken = sessionStorage.getItem('access_token');
    if (savedToken) {
      this.setAccessToken(savedToken);
    }

    this.broadcastChannel?.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as { type?: AuthSessionEvent; source?: string } | null;
      if (!data?.type || data.source === this.instanceId) {
        return;
      }
      this.sessionEventsSubject.next(data.type);
    });
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      sessionStorage.setItem('access_token', token);
    } else {
      sessionStorage.removeItem('access_token');
    }
    this.tokenSubject.next(token);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('auth/login', credentials, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
          this.notifySessionEvent('login');
        }),
      );
  }

  logout(): Observable<void> {
    return this.api.post<void>('auth/logout', {}, { withCredentials: true }).pipe(
      finalize(() => {
        this.setAccessToken(null);
        this.notifySessionEvent('logout');
      }),
    );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    if (!this.refreshInProgress$) {
      this.refreshInProgress$ = this.api
        .post<RefreshTokenResponse>('auth/refresh', {}, { withCredentials: true })
        .pipe(
          tap((response) => {
            this.setAccessToken(response.accessToken);
          }),
          finalize(() => {
            this.refreshInProgress$ = null;
          }),
          share(),
        );
    }
    return this.refreshInProgress$;
  }

  getCurrentUser(): Observable<User> {
    return this.api.get<User>('auth/me');
  }

  private notifySessionEvent(type: AuthSessionEvent): void {
    this.broadcastChannel?.postMessage({ type, source: this.instanceId });
  }
}
