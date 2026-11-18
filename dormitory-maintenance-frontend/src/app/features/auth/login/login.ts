import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '../state/auth.actions';
import { selectAuthLoading, selectAuthError } from '../state/auth.selectors';
import { MatModules, MatSnackBarCore } from '../../../shared/ui/material-modules';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MatModules],
  styleUrl: 'login.scss',
  templateUrl: 'login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBarCore.MatSnackBar);

  private hidePassword = signal(true);
  protected readonly error = this.store.selectSignal(selectAuthError);
  protected readonly loading = this.store.selectSignal(selectAuthLoading);

  constructor() {
    // effect(() => {
    //   const message = this.error();
    //   if (message)
    //     this.snackBar.open(message, 'OK', {
    //       panelClass: ['login-error-message-container'],
    //       horizontalPosition: 'center',
    //       verticalPosition: 'top',
    //     });
    // });
  }

  passwordVisibilityToggle() {
    this.hidePassword.set(!this.hidePassword());
  }

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (email && password) {
        this.store.dispatch(AuthActions.login({ credentials: { email, password } }));
      }
    }
  }
}
