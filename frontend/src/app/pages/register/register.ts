import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
selector: 'app-register',
standalone: true,
imports: [
FormsModule,
RouterLink
],
templateUrl: './register.html',
styleUrl: './register.css'
})
export class Register {
name = '';
email = '';
password = '';
confirmPassword = '';

loading = false;
error = '';

constructor(
private api: ApiService,
private router: Router
) {}

register(): void {
this.error = '';

const name = this.name.trim();
const email = this.email.trim().toLowerCase();
const password = this.password;
const confirmPassword = this.confirmPassword;

if (!name) {
  this.error = 'Please enter your name.';
  return;
}

if (name.length < 2) {
  this.error = 'Name must be at least 2 characters.';
  return;
}

if (!email) {
  this.error = 'Please enter your email.';
  return;
}

if (!this.isValidEmail(email)) {
  this.error = 'Please enter a valid email address.';
  return;
}

if (!password) {
  this.error = 'Please enter your password.';
  return;
}

if (password.length < 6) {
  this.error = 'Password must be at least 6 characters.';
  return;
}

if (!confirmPassword) {
  this.error = 'Please confirm your password.';
  return;
}

if (password !== confirmPassword) {
  this.error = 'Passwords do not match.';
  return;
}

this.loading = true;

this.api.register(
  name,
  email,
  password
).subscribe({
  next: () => {
    this.loading = false;

    this.router.navigate(['/login'], {
      queryParams: {
        registered: 'true'
      }
    });
  },

  error: (err: any) => {
    this.loading = false;

    if (err?.status === 409) {
      this.error = 'An account with this email already exists.';
    } else if (err?.status === 400) {
      this.error =
        err?.error?.message ??
        'Please check your information.';
    } else {
      this.error =
        'Unable to create your account. Please try again.';
    }
  }
});

}

private isValidEmail(email: string): boolean {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);
}
}
