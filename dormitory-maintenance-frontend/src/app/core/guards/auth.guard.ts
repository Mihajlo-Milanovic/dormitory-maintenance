import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectIsAuthenticated } from '../../features/auth/state/auth.selectors';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const authService = inject(AuthService);
  const router = inject(Router);

  // If session storage has token, consider authenticated or check store
  if (authService.getAccessToken()) {
    return true;
  }

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    })
  );
};
