import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { mockInterceptor } from './core/interceptors/mock.interceptor';
import { authReducer } from './features/auth/state/auth.reducer';
import { AuthEffects } from './features/auth/state/auth.effects';
import { studentReportReducer } from './features/student/state/student-report.reducer';
import { StudentReportEffects } from './features/student/state/student-report.effects';
import { janitorReducer } from './features/janitor/state/janitor.reducer';
import { JanitorEffects } from './features/janitor/state/janitor.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, mockInterceptor])),
    provideStore({
      auth: authReducer,
      studentReports: studentReportReducer,
      janitor: janitorReducer,
    }),
    provideEffects([AuthEffects, StudentReportEffects, JanitorEffects]),
  ],
};
