import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { timeout } from 'rxjs';

import { ApiService } from '../../services/api';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsPage implements OnInit {

  currentEmail = '';
  newEmail = '';
  emailPassword = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  emailLoading = false;
  passwordLoading = false;

  emailMessage = '';
  emailError = '';

  passwordMessage = '';
  passwordError = '';

  successMessage = '';
  isSuccessClosing = false;

  private successCloseTimer:
    ReturnType<typeof setTimeout> | null = null;

  private successRemoveTimer:
    ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {

    const userData =
      localStorage.getItem('moli_user');

    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    try {

      const user =
        JSON.parse(userData);

      this.currentEmail =
        user?.email ?? '';

    } catch {

      localStorage.removeItem(
        'moli_user'
      );

      this.router.navigate(['/login']);
    }
  }

  changeEmail(): void {

    const email =
      this.newEmail
        .trim()
        .toLowerCase();

    this.emailError = '';
    this.emailMessage = '';

    this.clearSuccessTimers();

    this.successMessage = '';
    this.isSuccessClosing = false;

    if (!email) {

      this.emailError =
        'กรุณากรอกอีเมลใหม่';

      return;
    }

    if (!this.isValidEmail(email)) {

      this.emailError =
        'รูปแบบอีเมลไม่ถูกต้อง';

      return;
    }

    if (!this.emailPassword) {

      this.emailError =
        'กรุณากรอกรหัสผ่านปัจจุบัน';

      return;
    }

    if (
      email ===
      this.currentEmail.toLowerCase()
    ) {

      this.emailError =
        'อีเมลใหม่ต้องแตกต่างจากอีเมลปัจจุบัน';

      return;
    }

    this.emailLoading = true;

    this.cdr.detectChanges();

    this.api
      .updateEmail(
        email,
        this.emailPassword
      )
      .pipe(
        timeout(10000)
      )
      .subscribe({

        next: (profile) => {

          this.currentEmail =
            profile.email;

          this.newEmail = '';
          this.emailPassword = '';

          localStorage.setItem(
            'moli_user',
            JSON.stringify(profile)
          );

          window.dispatchEvent(
            new CustomEvent(
              'moli-profile-updated',
              {
                detail: profile
              }
            )
          );

          this.emailLoading = false;

          this.showSuccess(
            'เปลี่ยนอีเมลเรียบร้อยแล้ว'
          );

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'UPDATE EMAIL ERROR:',
            error
          );

          this.emailLoading = false;

          if (
            error?.status === 401
          ) {

            localStorage.removeItem(
              'moli_token'
            );

            localStorage.removeItem(
              'moli_user'
            );

            this.router.navigate([
              '/login'
            ]);

            return;
          }

          if (
            error?.name === 'TimeoutError'
          ) {

            this.emailError =
              'เซิร์ฟเวอร์ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';

          } else {

            this.emailError =
              error.error?.message ||
              'ไม่สามารถเปลี่ยนอีเมลได้';
          }

          this.cdr.detectChanges();
        }

      });
  }

  changePassword(): void {

    this.passwordError = '';
    this.passwordMessage = '';

    this.clearSuccessTimers();

    this.successMessage = '';
    this.isSuccessClosing = false;

    if (!this.currentPassword) {

      this.passwordError =
        'กรุณากรอกรหัสผ่านปัจจุบัน';

      return;
    }

    if (!this.newPassword) {

      this.passwordError =
        'กรุณากรอกรหัสผ่านใหม่';

      return;
    }

    if (
      this.newPassword.length < 8
    ) {

      this.passwordError =
        'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';

      return;
    }

    if (!this.confirmPassword) {

      this.passwordError =
        'กรุณายืนยันรหัสผ่านใหม่';

      return;
    }

    if (
      this.newPassword !==
      this.confirmPassword
    ) {

      this.passwordError =
        'รหัสผ่านใหม่ไม่ตรงกัน';

      return;
    }

    if (
      this.currentPassword ===
      this.newPassword
    ) {

      this.passwordError =
        'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม';

      return;
    }

    this.passwordLoading = true;

    this.cdr.detectChanges();

    this.api
      .updatePassword(
        this.currentPassword,
        this.newPassword
      )
      .pipe(
        timeout(10000)
      )
      .subscribe({

        next: () => {

          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';

          this.passwordLoading = false;

          this.showSuccess(
            'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
          );

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'UPDATE PASSWORD ERROR:',
            error
          );

          this.passwordLoading = false;

          if (
            error?.status === 401
          ) {

            localStorage.removeItem(
              'moli_token'
            );

            localStorage.removeItem(
              'moli_user'
            );

            this.router.navigate([
              '/login'
            ]);

            return;
          }

          if (
            error?.name === 'TimeoutError'
          ) {

            this.passwordError =
              'เซิร์ฟเวอร์ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';

          } else {

            this.passwordError =
              error.error?.message ||
              'ไม่สามารถเปลี่ยนรหัสผ่านได้';
          }

          this.cdr.detectChanges();
        }

      });
  }

  isValidEmail(email: string): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }

  showSuccess(message: string): void {

    this.clearSuccessTimers();

    this.successMessage =
      message;

    this.emailError = '';
    this.passwordError = '';

    this.isSuccessClosing =
      false;

    this.cdr.detectChanges();

    /*
     * ค้าง 3.5 วินาที
     */

    this.successCloseTimer =
      setTimeout(() => {

        this.isSuccessClosing =
          true;

        this.cdr.detectChanges();

        /*
         * รอ slide-out 300ms
         * แล้วค่อยลบ popup
         */

        this.successRemoveTimer =
          setTimeout(() => {

            this.successMessage =
              '';

            this.isSuccessClosing =
              false;

            this.successRemoveTimer =
              null;

            this.cdr.detectChanges();

          }, 300);

        this.successCloseTimer =
          null;

      }, 3500);
  }

  closeSuccess(): void {

    this.clearSuccessTimers();

    this.isSuccessClosing =
      true;

    this.cdr.detectChanges();

    this.successRemoveTimer =
      setTimeout(() => {

        this.successMessage =
          '';

        this.isSuccessClosing =
          false;

        this.successRemoveTimer =
          null;

        this.cdr.detectChanges();

      }, 300);
  }

  private clearSuccessTimers(): void {

    if (
      this.successCloseTimer !== null
    ) {

      clearTimeout(
        this.successCloseTimer
      );

      this.successCloseTimer =
        null;
    }

    if (
      this.successRemoveTimer !== null
    ) {

      clearTimeout(
        this.successRemoveTimer
      );

      this.successRemoveTimer =
        null;
    }
  }
}