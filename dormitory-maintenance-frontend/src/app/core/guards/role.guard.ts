import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectUserRole } from '@store/selectors/auth.selectors';
import { UserRole } from '@models/user-role.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectUserRole).pipe(
      take(1),
      map((role) => {
        if (role && allowedRoles.includes(role)) {
          return true;
        }
        // Redirect to unauthorized or login
        return router.createUrlTree(['/auth/login']);
      }),
    );
  };
};
