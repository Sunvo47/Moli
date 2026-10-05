import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
selector: 'app-login',
standalone: true,
imports: [
FormsModule,
RouterLink
],
templateUrl: './login.html',
styleUrl: './login.css'
})
export class Login {
email = '';
password = '';

loading = false;
error = '';

constructor(
private api: ApiService,
private router: Router
) {}

login(): void {
this.error = '';

const email = this.email.trim();
const password = this.password;

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

this.loading = true;

this.api.login(email, password).subscribe({
  next: (result: any) => {
    if (!result?.token) {
      this.loading = false;
      this.error = 'Login failed. No token was returned.';
      return;
    }

    localStorage.setItem(
      'moli_token',
      result.token
    );

    if (result.user) {
      localStorage.setItem(
        'moli_user',
        JSON.stringify(result.user)
      );
    }

    this.loading = false;

    this.router.navigate(['/home']);
  },

  error: (err: any) => {
    this.loading = false;

    if (err?.status === 404) {
      this.error = 'No account found with this email.';
    } else if (err?.status === 401) {
      this.error = 'Incorrect password.';
    } else if (err?.status === 400) {
      this.error =
        err?.error?.message ??
        'Please check your email and password.';
    } else {
      this.error = 'Unable to login. Please try again.';
    }
  }
});

}

private isValidEmail(email: string): boolean {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(email);
}
}
