import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginRequest } from '../../../shared/models/auth.model';
import { User } from '../../../shared/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credentials: LoginRequest }>(),
    LoginSuccess: props<{ user: User }>(),
    LoginFailure: props<{ error: string }>(),
    Logout: emptyProps(),
    LogoutSuccess: emptyProps(),
    LoadCurrentUser: emptyProps(),
    LoadCurrentUserSuccess: props<{ user: User }>(),
    LoadCurrentUserFailure: props<{ error: string }>(),
  },
});
