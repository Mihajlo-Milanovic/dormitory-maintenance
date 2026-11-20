import { createReducer, on } from '@ngrx/store';
import { initialAuthState } from '@store/state/auth.state';
import { AuthActions } from '@store/actions/auth.actions';

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { ...user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    initialized: true,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    initialized: true,
    error,
  })),
  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
    initialized: true,
  })),
  on(AuthActions.loadCurrentUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loadCurrentUserSuccess, (state, { ...user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    initialized: true,
    error: null,
  })),
  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
    ...initialAuthState,
    initialized: true,
    error,
  })),
  on(AuthActions.sessionRestoreFinished, (state) => ({
    ...state,
    initialized: true,
  })),
);
