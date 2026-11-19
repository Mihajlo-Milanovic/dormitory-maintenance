import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '@store/actions/auth.actions';
import { selectAuthLoading, selectAuthError } from '@store/selectors/auth.selectors';
import { MatModules } from '@app/core/ui/material-modules';

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

  private hidePassword = signal(true);
  protected readonly error = this.store.selectSignal(selectAuthError);
  protected readonly loading = this.store.selectSignal(selectAuthLoading);

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
