import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '@store/state/auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (state) => state.user);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated,
);

export const selectUserRole = createSelector(selectCurrentUser, (user) => user?.role ?? null);

export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);

export const selectAuthInitialized = createSelector(
  selectAuthState,
  (state) => state.initialized,
);

export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
