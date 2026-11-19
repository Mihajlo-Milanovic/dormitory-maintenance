import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
