import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService, Movie } from '../../services/api';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './watch.html',
  styleUrl: './watch.css'
})
export class Watch implements OnInit, OnDestroy {
  movie: Movie | null = null;
  effectiveTrailerUrl: string | null = null;
  trailerEmbedUrl: SafeResourceUrl | null = null;
  trailerVideoUrl = '';
  loading = true;
  error = '';
  canWatch = false;
  checkingRental = false;
  rentalExpiresAt: string | null = null;
  watchedThisSession = false;
  recordingWatch = false;

  private youtubePlayer: { destroy(): void } | null = null;
  private youtubeApiPromise: Promise<any> | null = null;
  private youtubePlayerInitializing = false;
  private destroyed = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnDestroy(): void {
    this.destroyed = true;
    this.youtubePlayer?.destroy();
    this.youtubePlayer = null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.loading = false;
      this.error = 'Invalid movie ID.';
      return;
    }

    this.loadMovie(id);
  }

  loadMovie(id: number): void {
    this.loading = true;
    this.error = '';

    this.api.getMovie(id).subscribe({
      next: (movie: Movie) => {
        this.movie = movie;
        this.effectiveTrailerUrl = this.getEffectiveTrailerUrl(movie);
        this.trailerEmbedUrl = this.getTrailerEmbedUrl(this.effectiveTrailerUrl);
        this.trailerVideoUrl = this.getTrailerVideoUrl(this.effectiveTrailerUrl);
        this.loading = false;
        this.checkRental(id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load this movie.';
        this.cdr.detectChanges();
      }
    });
  }

  checkRental(movieId: number): void {
    this.canWatch = false;
    this.rentalExpiresAt = null;

    if (!localStorage.getItem('moli_token')) {
      this.checkingRental = false;
      return;
    }

    this.checkingRental = true;

    this.api.checkWatchPermission(movieId).subscribe({
      next: (result: any) => {
        this.canWatch = result.canWatch === true;
        this.rentalExpiresAt = result.expiresAt ?? null;
        this.checkingRental = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.canWatch = false;
        this.rentalExpiresAt = null;
        this.checkingRental = false;
        this.cdr.detectChanges();
      }
    });
  }

  normalizeTrailerUrl(value: string | null | undefined): string {
    if (!value) return '';

    const raw = value.trim();
    const markdown = raw.match(/\]\((https?:\/\/[^)\s]+)\)/i)
      || raw.match(/^\[(https?:\/\/[^\]]+)\]$/i);
    const candidate = markdown ? markdown[1] : raw;

    try {
      const url = new URL(candidate);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch {
      return '';
    }
  }

  getEffectiveTrailerUrl(movie: Movie): string | null {
    const saved = this.normalizeTrailerUrl(movie.trailerUrl);

    if (this.isYouTubeTrailer(saved) || this.isDirectVideoUrl(saved)) {
      return saved;
    }

    // Trailer สำรองสำหรับหนังที่มี URL อยู่ในข้อมูล Local
    // ช่วยให้เล่นได้แม้ API ที่ Deploy ยังส่ง trailerUrl เป็น null
    const knownTrailers: Record<string, string> = {
      'avengers: endgame': 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
      'spider-man: into the spider-verse': 'https://www.youtube.com/watch?v=pDsxJzLlq5U',
      'dune': 'https://www.youtube.com/watch?v=gApi7K5nBzs',
      'everything everywhere all at once': 'https://www.youtube.com/watch?v=wxN1T1uxQ2g',
      'oppenheimer': 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      'guardians of the galaxy vol. 3': 'https://www.youtube.com/watch?v=IFRpTsdO0E0',
      'the super mario bros. movie': 'https://www.youtube.com/watch?v=TnGl01FkMMo',
      'moana 2': 'https://www.youtube.com/watch?v=hDZ7y8RP5HE',
      'despicable me 4': 'https://www.youtube.com/watch?v=qQlr9-rF32A'
    };

    const fallback = knownTrailers[movie.title.trim().toLowerCase()];
    return fallback ? this.normalizeTrailerUrl(fallback) : null;
  }

  isYouTubeTrailer(value: string | null | undefined): boolean {
    const normalized = this.normalizeTrailerUrl(value);
    if (!normalized) return false;

    try {
      const url = new URL(normalized);
      const host = url.hostname.toLowerCase();
      const validHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
        'youtu.be'
      ];

      if (!validHosts.includes(host)) return false;

      // รองรับ YouTube Playlist
      if (host !== 'youtu.be' && url.pathname === '/playlist') {
        return !!url.searchParams.get('list');
      }

      const id = host === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v')
          || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1];

      return !!id && /^[\w-]{11}$/.test(id);
    } catch {
      return false;
    }
  }

  getTrailerEmbedUrl(value: string | null | undefined): SafeResourceUrl | null {
    const normalized = this.normalizeTrailerUrl(value);
    if (!normalized || !this.isYouTubeTrailer(normalized)) return null;

    try {
      const url = new URL(normalized);
      const host = url.hostname.toLowerCase();

      // ใช้ YouTube Embed สำหรับ Playlist โดยตรง
      if (host !== 'youtu.be' && url.pathname === '/playlist') {
        const listId = url.searchParams.get('list');
        if (!listId) return null;

        const embedUrl = new URL('https://www.youtube-nocookie.com/embed/videoseries');
        embedUrl.searchParams.set('list', listId);
        embedUrl.searchParams.set('rel', '0');
        embedUrl.searchParams.set('enablejsapi', '1');
        embedUrl.searchParams.set('origin', window.location.origin);

        return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl.href);
      }

      const id = host === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v')
          || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1];

      if (!id || !/^[\w-]{11}$/.test(id)) return null;

      const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
      embedUrl.searchParams.set('rel', '0');
      embedUrl.searchParams.set('enablejsapi', '1');
      embedUrl.searchParams.set('origin', window.location.origin);

      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl.href);
    } catch {
      return null;
    }
  }

  isDirectVideoUrl(value: string | null | undefined): boolean {
    const normalized = this.normalizeTrailerUrl(value);
    if (!normalized) return false;

    try {
      const url = new URL(normalized);
      return /\.(mp4|webm|ogg)$/i.test(url.pathname);
    } catch {
      return false;
    }
  }

  getTrailerVideoUrl(value: string | null | undefined): string {
    return this.isDirectVideoUrl(value)
      ? this.normalizeTrailerUrl(value)
      : '';
  }

  onYouTubeIframeLoad(): void {
    void this.initializeYouTubePlayer();
  }

  private async initializeYouTubePlayer(): Promise<void> {
    if (
      this.destroyed ||
      !this.movie ||
      !this.canWatch ||
      !this.isYouTubeTrailer(this.effectiveTrailerUrl) ||
      this.youtubePlayer ||
      this.youtubePlayerInitializing
    ) {
      return;
    }

    this.youtubePlayerInitializing = true;

    try {
      const YT = await this.loadYouTubeApi();
      if (this.destroyed) return;

      const iframe = document.getElementById('moli-youtube-player');
      if (!(iframe instanceof HTMLIFrameElement)) return;

      this.youtubePlayer = new YT.Player('moli-youtube-player', {
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === YT.PlayerState.PLAYING) {
              this.onPlay();
            }
          }
        }
      });
    } catch (error) {
      console.error('Unable to initialize YouTube player:', error);
    } finally {
      this.youtubePlayerInitializing = false;
    }
  }

  private loadYouTubeApi(): Promise<any> {
    if ((window as any).YT?.Player) {
      return Promise.resolve((window as any).YT);
    }

    if (this.youtubeApiPromise) return this.youtubeApiPromise;

    this.youtubeApiPromise = new Promise((resolve, reject) => {
      const previous = (window as any).onYouTubeIframeAPIReady;

      (window as any).onYouTubeIframeAPIReady = () => {
        try {
          previous?.();
        } catch (error) {
          console.error('Existing YouTube API callback failed:', error);
        }

        if ((window as any).YT?.Player) {
          resolve((window as any).YT);
        } else {
          reject(new Error('YouTube Player API did not initialize'));
        }
      };

      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load YouTube API'));
        document.head.appendChild(script);
      }
    });

    return this.youtubeApiPromise;
  }

  onPlay(): void {
    if (!this.movie || !this.canWatch || this.watchedThisSession || this.recordingWatch) {
      return;
    }

    this.recordingWatch = true;

    this.api.addWatchHistory(this.movie.id).subscribe({
      next: (result: any) => {
        this.watchedThisSession = true;
        this.recordingWatch = false;

        if (this.movie && typeof result.viewCount === 'number') {
          this.movie = { ...this.movie, viewCount: result.viewCount };
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.recordingWatch = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatExpiry(date: string | null): string {
    if (!date) return '';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getImageUrl(value: string | undefined): string {
    if (!value) return '';

    const markdownMatch = value.match(/\]\((https?:\/\/[^)]+)\)/);
    return markdownMatch ? markdownMatch[1] : value;
  }
}
