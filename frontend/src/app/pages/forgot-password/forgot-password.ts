import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
selector: 'app-forgot-password',
standalone: true,
imports: [
FormsModule,
RouterLink
],
templateUrl: './forgot-password.html',
styleUrl: './forgot-password.css'
})
export class ForgotPassword {
email = '';
newPassword = '';
confirmPassword = '';

loading = false;
error = '';
success = '';

constructor(
private api: ApiService,
private router: Router
) {}

resetPassword(): void {
this.error = '';
this.success = '';

const email = this.email.trim().toLowerCase();
const newPassword = this.newPassword;
const confirmPassword = this.confirmPassword;

if (!email) {
  this.error = 'Please enter your email.';
  return;
}

if (!this.isValidEmail(email)) {
  this.error = 'Please enter a valid email address.';
  return;
}

if (!newPassword) {
  this.error = 'Please enter your new password.';
  return;
}

if (newPassword.length < 6) {
  this.error = 'Password must be at least 6 characters.';
  return;
}

if (!confirmPassword) {
  this.error = 'Please confirm your new password.';
  return;
}

if (newPassword !== confirmPassword) {
  this.error = 'Passwords do not match.';
  return;
}

this.loading = true;

this.api.resetPassword(
  email,
  newPassword
).subscribe({
  next: () => {
    this.loading = false;
    this.success = 'Password reset successful. Redirecting to login...';

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1200);
  },

  error: (err: any) => {
    this.loading = false;

    if (err?.status === 404) {
      this.error = 'No account found with this email.';
    } else if (err?.status === 400) {
      this.error =
        err?.error?.message ??
        'Please check your information.';
    } else {
      this.error =
        'Unable to reset your password. Please try again.';
    }
  }
});

}

private isValidEmail(email: string): boolean {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);
}
}
