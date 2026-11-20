import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginRequest } from '@models/auth.model';
import { User } from '@models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<LoginRequest>(),
    LoginSuccess: props<User>(),
    LoginFailure: props<{ error: string }>(),
    Logout: emptyProps(),
    LogoutSuccess: emptyProps(),
    LogoutFailure: emptyProps(),
    LoadCurrentUser: emptyProps(),
    LoadCurrentUserSuccess: props<User>(),
    LoadCurrentUserFailure: props<{ error: string }>(),
    SessionRestoreFinished: emptyProps(),
  },
});
