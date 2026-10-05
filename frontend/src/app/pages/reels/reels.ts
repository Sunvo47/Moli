import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService, Reel } from '../../services/api';

@Component({
selector: 'app-reels',
standalone: true,
imports: [RouterLink],
templateUrl: './reels.html',
styleUrl: './reels.css'
})
export class Reels implements OnInit {
reels: Reel[] = [];
loading = true;
error = '';

likedReels = new Set<number>();
likeLoading = new Set<number>();
viewedReels = new Set<number>();

constructor(
private api: ApiService,
private sanitizer: DomSanitizer,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.loadReels();
}

loadReels(): void {
this.loading = true;
this.error = '';


this.api.getReels().subscribe({
  next: (reels) => {
    // สุ่มลำดับ Reel ทุกครั้งที่โหลดหน้า
    this.reels = [...reels].sort(() => Math.random() - 0.5);

    this.loading = false;

    this.cdr.detectChanges();

    this.reels.forEach((reel) => {
      this.loadLikeStatus(reel);
    });
  },
  error: () => {
    this.loading = false;
    this.error = 'Unable to load reels. Please try again.';

    this.cdr.detectChanges();
  }
});


}

recordView(reel: Reel): void {
if (this.viewedReels.has(reel.id)) return;


this.viewedReels.add(reel.id);

this.api.recordReelView(reel.id).subscribe({
  next: (result: any) => {
    reel.viewCount = result.viewCount ?? reel.viewCount + 1;
    this.cdr.detectChanges();
  },
  error: () => {
    this.viewedReels.delete(reel.id);
  }
});


}

loadLikeStatus(reel: Reel): void {
const token = localStorage.getItem('moli_token');


if (!token) return;

this.api.getReelLike(reel.id).subscribe({
  next: (result: any) => {
    if (result.liked) {
      this.likedReels.add(reel.id);
    }

    this.cdr.detectChanges();
  },
  error: () => {
    // Like status is optional and must not block the Reel page.
  }
});


}

toggleLike(reel: Reel): void {
const token = localStorage.getItem('moli_token');


if (!token) {
  this.error = 'Please login to like reels.';
  this.cdr.detectChanges();
  return;
}

if (this.likeLoading.has(reel.id)) return;

this.likeLoading.add(reel.id);

this.api.likeReel(reel.id).subscribe({
  next: (result: any) => {
    reel.likeCount = result.likeCount ?? reel.likeCount;

    if (result.liked) {
      this.likedReels.add(reel.id);
    } else {
      this.likedReels.delete(reel.id);
    }

    this.likeLoading.delete(reel.id);
    this.cdr.detectChanges();
  },
  error: () => {
    this.likeLoading.delete(reel.id);
    this.error = 'Unable to update like.';
    this.cdr.detectChanges();
  }
});


}

isLiked(reelId: number): boolean {
return this.likedReels.has(reelId);
}

shareReel(reel: Reel): void {
const url = `${window.location.origin}/reels/${reel.id}`;


if (navigator.share) {
  navigator.share({
    title: reel.title,
    text: reel.description,
    url
  }).catch(() => {});
  return;
}

this.error = 'Sharing is not available in this browser.';
this.cdr.detectChanges();


}

getImageUrl(value: string | undefined): string {
if (!value) return '';


const markdownMatch = value.match(/\]\((https?:\/\/[^)]+)\)/);

if (markdownMatch) {
  return markdownMatch[1];
}

return value;


}

isYouTubeUrl(value: string | undefined): boolean {
if (!value) return false;


return (
  value.includes('youtube.com/watch') ||
  value.includes('youtu.be/') ||
  value.includes('youtube.com/embed/')
);


}

getYouTubeVideoId(value: string | undefined): string {
if (!value) return '';


const cleanUrl = this.getImageUrl(value);

try {
  const url = new URL(cleanUrl);

  if (url.hostname.includes('youtu.be')) {
    return url.pathname.replace('/', '');
  }

  if (url.pathname.includes('/embed/')) {
    return url.pathname.split('/embed/')[1].split('/')[0];
  }

  return url.searchParams.get('v') ?? '';
} catch {
  return '';
}


}

getYouTubeEmbedUrl(value: string | undefined): SafeResourceUrl {
const videoId = this.getYouTubeVideoId(value);


const embedUrl =
  `https://www.youtube-nocookie.com/embed/${videoId}` +
  '?autoplay=1' +
  '&mute=1' +
  '&controls=1' +
  '&rel=0' +
  '&modestbranding=1' +
  '&playsinline=1' +
  '&loop=1' +
  `&playlist=${videoId}`;

return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);


}

trackReel(_index: number, reel: Reel): number {
return reel.id;
}
}
