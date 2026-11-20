import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@services/auth.service';

const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh'];

function isAuthExempt(url: string): boolean {
  // Match against the pathname rather than a raw substring, so e.g.
  // '/api/user-auth/refresh-settings' doesn't falsely match 'auth/refresh'.
  try {
    const path = new URL(url, window.location.origin).pathname;
    return AUTH_EXEMPT_PATHS.some((exempt) => path.endsWith(exempt));
  } catch {
    return AUTH_EXEMPT_PATHS.some((exempt) => url.includes(exempt));
  }
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === HttpStatusCode.Unauthorized && !isAuthExempt(req.url)) {
        // authService.refreshToken() must return a single shared observable
        // (e.g. backed by a BehaviorSubject + shareReplay) so that concurrent
        // 401s from multiple in-flight requests all piggyback on ONE refresh
        // call instead of each firing its own. See auth.service.ts.
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Clone from authReq (which already carries the old auth header
            // plus any other headers/params previously applied), not from
            // the original req, so nothing added upstream gets dropped.
            const newReq = authReq.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            // Clear local state only — don't call authService.logout() here:
            // it hits an authenticated endpoint that will itself 401, and
            // subscribing to it to redirect is the app shell's job, not the
            // interceptor's. Listen on accessToken$ (or a router guard) to
            // redirect to /login when it goes null.
            authService.setAccessToken(null);
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
