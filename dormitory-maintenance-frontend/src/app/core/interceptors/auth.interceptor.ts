import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
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
      if (error.status === 401 && !req.url.includes('auth/login') && !req.url.includes('auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap((response) => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            authService.setAccessToken(null);
            // Optionally redirect to login or dispatch logout action
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
