import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService, Reel } from '../../services/api';

interface MoliYouTubePlayer {
  getVolume(): number;
  isMuted(): boolean;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  playVideo(): void;
  pauseVideo(): void;
}

interface MoliYouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      events: {
        onReady: (event: { target: MoliYouTubePlayer }) => void;
      };
    }
  ) => MoliYouTubePlayer;
}

declare global {
  interface Window {
    YT?: MoliYouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}


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
private youtubeEmbedUrlCache = new Map<string, SafeResourceUrl>();
@ViewChild('reelsFeed') reelsFeed?: ElementRef<HTMLElement>;
reelsVolume = 70;
reelsMuted = false;
private activeReelCard: HTMLElement | null = null;
private youtubePlayers = new Map<HTMLIFrameElement, MoliYouTubePlayer>();
private volumePollTimer: ReturnType<typeof setInterval> | null = null;


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
    this.loadYouTubeApi();

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
  const cleanUrl = this.getImageUrl(value);
  const cached = this.youtubeEmbedUrlCache.get(cleanUrl);
  if (cached) return cached;

  const videoId = this.getYouTubeVideoId(cleanUrl);
  if (!videoId) {
    return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
  }

  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    '?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1&loop=1' +
    `&playlist=${videoId}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

  const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  this.youtubeEmbedUrlCache.set(cleanUrl, safeUrl);
  return safeUrl;
}


private loadYouTubeApi(): void {
  if (window.YT?.Player) {
    this.initializeYouTubePlayers();
    return;
  }

  const previousCallback = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    previousCallback?.();
    this.initializeYouTubePlayers();
  };

  if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  }
}

private initializeYouTubePlayers(): void {
  if (!window.YT?.Player) return;

  const feed = this.reelsFeed?.nativeElement;
  if (!feed) return;

  feed.querySelectorAll<HTMLIFrameElement>('iframe.reel-video').forEach((iframe) => {
    if (this.youtubePlayers.has(iframe)) return;

    try {
      new window.YT!.Player(iframe, {
        events: {
          onReady: (event) => {
            this.youtubePlayers.set(iframe, event.target);
            event.target.setVolume(this.reelsVolume);

            if (this.reelsMuted) event.target.mute();
            else event.target.unMute();

            if (iframe.closest('.reel-card') === this.activeReelCard) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }

            this.startVolumePolling();
          }
        }
      });
    } catch {
      // คงคำสั่ง postMessage เดิมไว้เป็น fallback
    }
  });
}

private startVolumePolling(): void {
  if (this.volumePollTimer) return;

  this.volumePollTimer = setInterval(() => {
    const iframe = this.activeReelCard?.querySelector<HTMLIFrameElement>(
      'iframe.reel-video'
    );
    if (!iframe) return;

    const player = this.youtubePlayers.get(iframe);
    if (!player) return;

    const volume = player.getVolume();
    if (Number.isFinite(volume)) {
      this.reelsVolume = Math.max(0, Math.min(100, volume));
    }
    this.reelsMuted = player.isMuted();
  }, 300);
}

handleFeedScroll(): void {
  const feed = this.reelsFeed?.nativeElement;
  if (!feed) return;

  const feedRect = feed.getBoundingClientRect();
  const feedCenter = feedRect.top + feedRect.height / 2;
  const cards = Array.from(feed.querySelectorAll<HTMLElement>('.reel-card'));
  if (!cards.length) return;

  let activeCard: HTMLElement | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - feedCenter);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      activeCard = card;
    }
  }

  if (!activeCard || activeCard === this.activeReelCard) return;

  // อ่านค่าจริงจากคลิปเดิมก่อนเปลี่ยนไปคลิปใหม่
  const previousCard = this.activeReelCard;
  if (previousCard) {
    const previousIframe =
      previousCard.querySelector<HTMLIFrameElement>('iframe.reel-video');
    const previousPlayer = previousIframe
      ? this.youtubePlayers.get(previousIframe)
      : undefined;

    if (previousPlayer) {
      this.reelsVolume = previousPlayer.getVolume();
      this.reelsMuted = previousPlayer.isMuted();
      previousPlayer.pauseVideo();
    } else if (previousIframe) {
      this.sendYouTubeCommand(previousIframe, 'pauseVideo');
    }

    const previousVideo = previousCard.querySelector<HTMLVideoElement>('video.reel-video');
    if (previousVideo) previousVideo.pause();
  }

  this.activeReelCard = activeCard;

  const iframe = activeCard.querySelector<HTMLIFrameElement>('iframe.reel-video');
  const video = activeCard.querySelector<HTMLVideoElement>('video.reel-video');

  if (iframe) {
    const player = this.youtubePlayers.get(iframe);
    if (player) {
      player.setVolume(this.reelsVolume);
      if (this.reelsMuted) player.mute();
      else player.unMute();
      player.playVideo();
    } else {
      this.sendYouTubeCommand(iframe, 'setVolume', [this.reelsVolume]);
      this.sendYouTubeCommand(iframe, this.reelsMuted ? 'mute' : 'unMute');
      this.sendYouTubeCommand(iframe, 'playVideo');
    }
  }

  if (video) {
    video.volume = this.reelsVolume / 100;
    video.muted = this.reelsMuted;
    void video.play().catch(() => {});
  }
}

private sendYouTubeCommand(
  iframe: HTMLIFrameElement,
  func: string,
  args: unknown[] = []
): void {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*'
  );
}

setReelsVolume(value: string | number): void {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return;

  this.reelsVolume = Math.max(0, Math.min(100, volume));
  this.reelsMuted = this.reelsVolume === 0;
  this.applyReelsAudio();
}

toggleReelsMute(): void {
  this.reelsMuted = !this.reelsMuted;
  this.applyReelsAudio();
}

private applyReelsAudio(): void {
  const feed = this.reelsFeed?.nativeElement;
  if (!feed) return;

  feed.querySelectorAll<HTMLIFrameElement>('iframe.reel-video').forEach((iframe) => {
    const player = this.youtubePlayers.get(iframe);
    if (player) {
      player.setVolume(this.reelsVolume);
      if (this.reelsMuted) player.mute();
      else player.unMute();
    } else {
      this.sendYouTubeCommand(iframe, 'setVolume', [this.reelsVolume]);
      this.sendYouTubeCommand(iframe, this.reelsMuted ? 'mute' : 'unMute');
    }
  });

  feed.querySelectorAll<HTMLVideoElement>('video.reel-video').forEach((video) => {
    video.volume = this.reelsVolume / 100;
    video.muted = this.reelsMuted;
  });
}

trackReel(_index: number, reel: Reel): number {
return reel.id;
}
}
