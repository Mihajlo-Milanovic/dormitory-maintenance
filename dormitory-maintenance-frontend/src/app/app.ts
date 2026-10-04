import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated, selectCurrentUser, selectUserRole } from './features/auth/state/auth.selectors';
import { AuthActions } from './features/auth/state/auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly store = inject(Store);

  protected readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  protected readonly currentUser$ = this.store.select(selectCurrentUser);
  protected readonly userRole$ = this.store.select(selectUserRole);

  protected onLogout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
