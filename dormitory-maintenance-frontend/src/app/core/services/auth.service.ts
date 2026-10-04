import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../../shared/models/auth.model';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private accessToken: string | null = null;

  constructor() {
    // Restore token from session storage on init if present
    const savedToken = sessionStorage.getItem('access_token');
    if (savedToken) {
      this.accessToken = savedToken;
    }
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      sessionStorage.setItem('access_token', token);
    } else {
      sessionStorage.removeItem('access_token');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', credentials).pipe(
      tap((response) => {
        this.setAccessToken(response.accessToken);
      })
    );
  }

  logout(): Observable<void> {
    return this.api.post<void>('auth/logout', {}).pipe(
      tap(() => {
        this.setAccessToken(null);
      })
    );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    return this.api.post<RefreshTokenResponse>('auth/refresh', {}).pipe(
      tap((response) => {
        this.setAccessToken(response.accessToken);
      })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.api.get<User>('auth/me');
  }
}
