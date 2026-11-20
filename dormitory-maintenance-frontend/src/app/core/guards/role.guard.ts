import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { selectAuthInitialized, selectUserRole } from '@store/selectors/auth.selectors';
import { UserRole } from '@models/user-role.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectAuthInitialized).pipe(
      filter((initialized) => initialized),
      take(1),
      switchMap(() => store.select(selectUserRole).pipe(take(1))),
      map((role) => {
        if (role && allowedRoles.includes(role)) {
          return true;
        }
        if (role) {
          return router.createUrlTree([`/${role}`]);
        }
        return router.createUrlTree(['/auth/login']);
      }),
    );
  };
};
