import { Component, HostListener } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-admin-troll',
  styleUrl: './admin-troll.css',
  templateUrl: './admin-troll.html',
})
export class AdminTroll {
  // จุดเริ่มต้น = ตำแหน่งเดิมตรงกลาง
  monkeyX = 0;
  monkeyY = 0;

  jumpScare = false;

  private chasing = false;
  private chaseStart = 0;
  private lastMove = 0;
  private jumpTimer?: ReturnType<typeof setTimeout>;

  // ล็อกลิงไว้ก่อน ให้ animation เปิดหน้าจบก่อน
  private movementReady = false;

  constructor() {
    setTimeout(() => {
      this.movementReady = true;
    }, 2200);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.jumpScare || !this.movementReady) return;

    const monkey = document.querySelector(
      '.monkey-mover'
    ) as HTMLElement | null;

    const page = document.querySelector(
      '.troll-page'
    ) as HTMLElement | null;

    if (!monkey || !page) return;

    const rect = monkey.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();

    /*
     * กรอบสี่เหลี่ยมล่องหนรอบลิง
     */
    const paddingX = 180;
    const paddingY = 150;

    const insideBox =
      event.clientX >= rect.left - paddingX &&
      event.clientX <= rect.right + paddingX &&
      event.clientY >= rect.top - paddingY &&
      event.clientY <= rect.bottom + paddingY;

    // เมาส์ออกจากกรอบ = หยุดนับเวลา
    if (!insideBox) {
      this.chasing = false;
      return;
    }

    const now = performance.now();

    if (!this.chasing) {
      this.chasing = true;
      this.chaseStart = now;
    }

    // ไล่ประมาณ 2 วิ = ลิงเอาคืน
    if (now - this.chaseStart >= 2000) {
      this.triggerJumpScare();
      return;
    }

    if (now - this.lastMove < 25) return;
    this.lastMove = now;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = centerX - event.clientX;
    let dy = centerY - event.clientY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      dx = 1;
      dy = 0;
    } else {
      dx /= distance;
      dy /= distance;
    }

    // ความเร็วลิง
    const moveSpeed = 28;

    this.monkeyX += dx * moveSpeed;
    this.monkeyY += dy * moveSpeed;

    /*
     * จุดอ้างอิง = จุดกลางของ troll-page
     * ทำให้ลิงกลับ 0,0 แล้วอยู่ตำแหน่งเดิมเสมอ
     */
    const pageCenterX =
      pageRect.left + pageRect.width / 2;

    const pageCenterY =
      pageRect.top + pageRect.height / 2;

    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;

    const margin = 20;

    const minX =
      pageRect.left +
      halfWidth +
      margin -
      pageCenterX;

    const maxX =
      pageRect.right -
      halfWidth -
      margin -
      pageCenterX;

    const minY =
      pageRect.top +
      halfHeight +
      margin -
      pageCenterY;

    const maxY =
      pageRect.bottom -
      halfHeight -
      margin -
      pageCenterY;

    this.monkeyX = Math.max(
      minX,
      Math.min(maxX, this.monkeyX)
    );

    this.monkeyY = Math.max(
      minY,
      Math.min(maxY, this.monkeyY)
    );
  }

  private triggerJumpScare() {
    if (this.jumpScare) return;

    this.jumpScare = true;
    this.chasing = false;

    // 🔊 HA HA HA HA HA HA
    this.playLaugh();

    // jumpscare จบ → กลับตำแหน่งเดิม
    this.jumpTimer = setTimeout(() => {
      this.monkeyX = 0;
      this.monkeyY = 0;
      this.jumpScare = false;
    }, 1800);
  }

  private playLaugh() {
    try {
      const laugh = new Audio('/audio/laugh.mp3');

      laugh.volume = 1.0;
      laugh.currentTime = 0;

      laugh.play().catch((error) => {
        console.log('Laugh audio could not be played:', error);
      });
    } catch (error) {
      console.log('Laugh audio error:', error);
    }
  }
}
