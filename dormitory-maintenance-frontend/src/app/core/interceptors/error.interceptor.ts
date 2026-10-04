import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Global error logging or notification handling can be added here
      console.error('HTTP Error intercepted:', error);
      return throwError(() => error);
    })
  );
};
