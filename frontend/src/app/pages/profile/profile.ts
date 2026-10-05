import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { timeout } from 'rxjs';

import {
  ApiService,
  Profile
} from '../../services/api';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfilePage implements OnInit {

  profile: Profile | null = null;

  name = '';
  profileImage = '';

  originalName = '';
  originalProfileImage = '';

  isLoading = true;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  isSuccessClosing = false;

  private successCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private successRemoveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLocalUser();
    this.loadProfile();
  }

  loadLocalUser(): void {
    const userData =
      localStorage.getItem('moli_user');

    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user =
        JSON.parse(userData);

      this.profile = user;

      this.name =
        user.name ?? '';

      this.profileImage =
        user.profileImage ?? '';

      this.originalName =
        this.name;

      this.originalProfileImage =
        this.profileImage;

      this.isLoading = false;

    } catch {
      localStorage.removeItem('moli_user');
      this.router.navigate(['/login']);
    }
  }

  loadProfile(): void {
    this.api.getProfile().subscribe({

      next: (profile) => {

        this.profile =
          profile;

        this.name =
          profile.name ?? '';

        this.profileImage =
          profile.profileImage ?? '';

        this.originalName =
          this.name;

        this.originalProfileImage =
          this.profileImage;

        localStorage.setItem(
          'moli_user',
          JSON.stringify(profile)
        );

        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {

        this.isLoading = false;

        if (error.status === 401) {

          localStorage.removeItem(
            'moli_token'
          );

          localStorage.removeItem(
            'moli_user'
          );

          this.router.navigate(['/login']);

          return;
        }

        this.errorMessage =
          error.error?.message ||
          'ไม่สามารถโหลดข้อมูลโปรไฟล์จากเซิร์ฟเวอร์ได้';

        this.cdr.detectChanges();
      }

    });
  }

  saveProfile(): void {

    const trimmedName =
      this.name.trim();

    this.errorMessage = '';

    this.clearSuccessTimers();

    this.successMessage = '';
    this.isSuccessClosing = false;

    const nameChanged =
      trimmedName !== this.originalName;

    const imageChanged =
      this.profileImage !==
      this.originalProfileImage;

    /*
     * ไม่มีอะไรเปลี่ยน
     */

    if (!nameChanged && !imageChanged) {

      this.showSuccess(
        'ไม่มีข้อมูลที่เปลี่ยนแปลง'
      );

      return;
    }

    /*
     * ตรวจสอบชื่อ
     */

    if (nameChanged) {

      if (!trimmedName) {

        this.errorMessage =
          'กรุณากรอกชื่อ';

        this.cdr.detectChanges();

        return;
      }

      if (trimmedName.length > 50) {

        this.errorMessage =
          'ชื่อยาวเกินไป';

        this.cdr.detectChanges();

        return;
      }
    }

    /*
     * เริ่มบันทึก
     */

    this.isSaving = true;

    this.cdr.detectChanges();

    const updateData: {
      name?: string;
      profileImage?: string | null;
    } = {};

    if (nameChanged) {

      updateData.name =
        trimmedName;
    }

    if (imageChanged) {

      updateData.profileImage =
        this.profileImage || null;
    }

    /*
     * ส่งข้อมูลไป Backend
     *
     * timeout 10 วินาที
     * ป้องกันปุ่ม Saving... ค้างถ้า API ไม่ตอบ
     */

    this.api
      .updateProfile(updateData)
      .pipe(
        timeout(10000)
      )
      .subscribe({

        next: (profile) => {

          console.log(
            'PROFILE UPDATED:',
            profile
          );

          this.profile = {
            ...profile
          };

          this.name =
            profile.name ?? '';

          this.profileImage =
            profile.profileImage ?? '';

          this.originalName =
            this.name;

          this.originalProfileImage =
            this.profileImage;

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

          /*
           * สำคัญ:
           * ให้ปุ่มกลับเป็น Save Changes
           */

          this.isSaving = false;

          /*
           * แสดง Success Popup
           */

          if (
            nameChanged &&
            imageChanged
          ) {

            this.showSuccess(
              'เปลี่ยนชื่อและรูปโปรไฟล์สำเร็จ'
            );

          } else if (nameChanged) {

            this.showSuccess(
              'เปลี่ยนชื่อสำเร็จ'
            );

          } else if (
            imageChanged &&
            this.profileImage
          ) {

            this.showSuccess(
              'เปลี่ยนรูปโปรไฟล์สำเร็จ'
            );

          } else {

            this.showSuccess(
              'ลบรูปโปรไฟล์สำเร็จ'
            );
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'PROFILE UPDATE ERROR:',
            error
          );

          /*
           * สำคัญ:
           * ไม่ว่าจะ Error หรือ Timeout
           * ปุ่มต้องกลับมาใช้งานได้
           */

          this.isSaving = false;

          if (
            error?.name === 'TimeoutError'
          ) {

            this.errorMessage =
              'เซิร์ฟเวอร์ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';

          } else {

            this.errorMessage =
              error.error?.message ||
              'ไม่สามารถบันทึกข้อมูลได้';
          }

          this.cdr.detectChanges();
        }

      });
  }

  showSuccess(message: string): void {

    /*
     * เคลียร์ timer เดิมก่อน
     * ป้องกัน popup ซ้อน / timer ชนกัน
     */

    this.clearSuccessTimers();

    /*
     * แสดง popup
     */

    this.successMessage =
      message;

    this.errorMessage = '';

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
         * รอ animation slide-out 300ms
         * แล้วค่อยเอา popup ออกจาก DOM
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

    /*
     * ถ้ากด X ให้ยกเลิก timer เดิม
     */

    this.clearSuccessTimers();

    /*
     * เริ่ม slide ออกทางขวา
     */

    this.isSuccessClosing =
      true;

    this.cdr.detectChanges();

    /*
     * รอ animation จบ
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

  onImageSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      !input.files[0]
    ) {
      return;
    }

    const file =
      input.files[0];

    this.errorMessage = '';
    this.successMessage = '';

    this.clearSuccessTimers();

    if (!file.type.startsWith('image/')) {

      this.errorMessage =
        'กรุณาเลือกไฟล์รูปภาพ';

      input.value = '';

      this.cdr.detectChanges();

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        'รูปภาพมีขนาดใหญ่เกินไป\nกรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB'
      );

      input.value = '';

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {

      const image =
        new Image();

      image.onload = () => {

        const maxSize =
          256;

        let width =
          image.width;

        let height =
          image.height;

        if (width > height) {

          if (width > maxSize) {

            height =
              Math.round(
                height *
                maxSize /
                width
              );

            width =
              maxSize;
          }

        } else {

          if (height > maxSize) {

            width =
              Math.round(
                width *
                maxSize /
                height
              );

            height =
              maxSize;
          }
        }

        const canvas =
          document.createElement(
            'canvas'
          );

        canvas.width =
          width;

        canvas.height =
          height;

        const context =
          canvas.getContext('2d');

        if (!context) {

          this.errorMessage =
            'ไม่สามารถประมวลผลรูปภาพได้';

          this.cdr.detectChanges();

          return;
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        this.profileImage =
          canvas.toDataURL(
            'image/jpeg',
            0.8
          );

        this.cdr.detectChanges();
      };

      image.src =
        reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  removeImage(): void {

    this.profileImage = '';

    this.errorMessage = '';
    this.successMessage = '';

    this.clearSuccessTimers();

    this.cdr.detectChanges();
  }

  getProfileImage(): string {
    return this.profileImage || '';
  }
}