import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { catchError, firstValueFrom, of, tap } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
// import { mockInterceptor } from './core/interceptors/mock.interceptor';
import { authReducer } from '@store/reducers/auth.reducer';
import { AuthEffects } from '@store/effects/auth.effects';
import { studentReportReducer } from '@store/reducers/student-report.reducer';
import { StudentReportEffects } from '@store/effects/student-report.effects';
import { janitorReducer } from '@store/reducers/janitor.reducer';
import { JanitorEffects } from '@store/effects/janitor.effects';
import { AuthService } from '@services/auth.service';
import { AuthActions } from '@store/actions/auth.actions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const store = inject(Store);

      const token = authService.getAccessToken();
      if (!token) {
        store.dispatch(AuthActions.sessionRestoreFinished());
        return;
      }

      return firstValueFrom(
        authService.getCurrentUser().pipe(
          tap((user) => store.dispatch(AuthActions.loadCurrentUserSuccess(user))),
          catchError((error) => {
            authService.setAccessToken(null);
            store.dispatch(
              AuthActions.loadCurrentUserFailure({
                error: error?.message || 'Failed to restore session',
              }),
            );
            return of(null);
          }),
        ),
      );
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor /*, mockInterceptor*/])),
    provideStore({
      auth: authReducer,
      studentReports: studentReportReducer,
      janitor: janitorReducer,
    }),
    provideEffects([AuthEffects, StudentReportEffects, JanitorEffects]),
  ],
};
