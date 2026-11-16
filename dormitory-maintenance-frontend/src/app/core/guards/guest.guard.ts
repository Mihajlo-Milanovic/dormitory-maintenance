import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectUserRole } from '../../features/auth/state/auth.selectors';

export const guestGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectUserRole).pipe(
    take(1),
    map((role) => {
      return role ? router.createUrlTree([`/${role}`]) : true;
    }),
  );
};
