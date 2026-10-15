import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService, Movie } from '../../services/api';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.css'
})
export class MovieDetail implements OnInit, OnDestroy {
  movie: Movie | null = null;
  loading = true;
  error = '';
  liked = false;
  likeLoading = false;
  rentLoading = false;
  rentalMessage = '';
  rentalExpiresAt: string | null = null;
  remainingRentalMs = 0;
  private rentalTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || id <= 0) {
      this.loading = false;
      this.error = 'Invalid movie ID.';
      this.cdr.detectChanges();
      return;
    }

    this.loadMovie(id);
  }

  loadMovie(id: number): void {
    this.loading = true;
    this.error = '';

    this.api.getMovie(id).subscribe({
      next: (movie) => {
        this.movie = movie;
        this.loading = false;
        this.loadLikeStatus(id);
        this.loadRentalStatus(id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load this movie.';
        this.cdr.detectChanges();
      }
    });
  }

  rentMovie(): void {
    if (!this.movie || this.rentLoading) {
      return;
    }

    if (!localStorage.getItem('moli_token')) {
      this.rentalMessage = 'Please login to rent movies.';
      this.cdr.detectChanges();
      return;
    }

    this.rentLoading = true;
    this.rentalMessage = '';

    this.api.rentMovie(this.movie.id).subscribe({
      next: (response) => {
        this.rentLoading = false;
        this.rentalMessage =
          'Rental activated. You can watch this movie now.';
        this.setRentalExpiry(response.rental?.expiresAt);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.rentLoading = false;
        this.rentalMessage =
          error.status === 409
            ? 'You already have an active rental for this movie.'
            : 'Unable to rent this movie.';
        if (error.status === 409 && error.error?.expiresAt) {
          this.setRentalExpiry(error.error.expiresAt);
        } else if (error.status === 409 && this.movie) {
          this.loadRentalStatus(this.movie.id);
        }
        this.cdr.detectChanges();
      }
    });
  }


  loadRentalStatus(movieId: number): void {
    if (!localStorage.getItem('moli_token')) {
      this.setRentalExpiry(null);
      return;
    }

    this.api.getMyRentals().subscribe({
      next: (rentals) => {
        const rental = rentals.find((item) =>
          item.movieId === movieId &&
          item.status === 'ACTIVE' &&
          new Date(item.expiresAt).getTime() > Date.now()
        );
        this.setRentalExpiry(rental?.expiresAt ?? null);
      },
      error: () => this.setRentalExpiry(null)
    });
  }

  setRentalExpiry(expiresAt: string | null | undefined): void {
    if (this.rentalTimer !== null) {
      clearInterval(this.rentalTimer);
      this.rentalTimer = null;
    }

    const expiry = expiresAt ? new Date(expiresAt).getTime() : NaN;
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      this.rentalExpiresAt = null;
      this.remainingRentalMs = 0;
      this.cdr.detectChanges();
      return;
    }

    this.rentalExpiresAt = new Date(expiry).toISOString();
    this.updateRentalCountdown();
    this.rentalTimer = setInterval(
      () => this.updateRentalCountdown(), 1000
    );
  }

  updateRentalCountdown(): void {
    if (!this.rentalExpiresAt) {
      this.remainingRentalMs = 0;
      return;
    }

    this.remainingRentalMs = Math.max(
      0, new Date(this.rentalExpiresAt).getTime() - Date.now()
    );

    if (this.remainingRentalMs === 0) {
      if (this.rentalTimer !== null) clearInterval(this.rentalTimer);
      this.rentalTimer = null;
      this.rentalExpiresAt = null;
    }

    this.cdr.detectChanges();
  }

  getRentalTimeRemaining(): string {
    const total = Math.ceil(this.remainingRentalMs / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (days > 0) return `${days} วัน ${hours} ชม. ${minutes} นาที`;
    if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
    if (minutes > 0) return `${minutes} นาที ${seconds} วินาที`;
    return `${seconds} วินาที`;
  }

  ngOnDestroy(): void {
    if (this.rentalTimer !== null) clearInterval(this.rentalTimer);
  }

  loadLikeStatus(id: number): void {
    const token = localStorage.getItem('moli_token');

    if (!token) {
      return;
    }

    this.api.getMovieLike(id).subscribe({
      next: (result) => {
        this.liked = result.liked;
        this.cdr.detectChanges();
      },
      error: () => {
        this.liked = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleLike(): void {
    if (!this.movie || this.likeLoading) {
      return;
    }

    const token = localStorage.getItem('moli_token');

    if (!token) {
      this.error = 'Please login to like movies.';
      this.cdr.detectChanges();
      return;
    }

    this.likeLoading = true;

    this.api.likeMovie(this.movie.id).subscribe({
      next: (result) => {
        this.liked = result.liked;

        this.movie = {
          ...this.movie!,
          likeCount: result.likeCount
        };

        this.likeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.likeLoading = false;
        this.error = 'Unable to update like.';
        this.cdr.detectChanges();
      }
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }

    return `${hours}h ${mins}m`;
  }

  getImageUrl(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const markdownMatch = value.match(/\]\((https?:\/\/[^)]+)\)/);

    if (markdownMatch) {
      return markdownMatch[1];
    }

    return value;
  }

  getBackdropUrl(): string {
    if (!this.movie) {
      return '';
    }

    const backdrop = this.getImageUrl(this.movie.backdrop);

    if (backdrop) {
      return backdrop;
    }

    return this.getImageUrl(this.movie.poster);
  }

  getPreviewImageUrl(): string {
    if (!this.movie) {
      return '';
    }

    const preview = this.getImageUrl(this.movie.previewImage || '');
    return preview || this.getBackdropUrl();
  }



  getTrailerEmbedUrl(value: string): SafeResourceUrl {
    let raw = (value || '').trim();

    const markdownMatch = raw.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (markdownMatch) raw = markdownMatch[2].trim();

    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      let videoId = '';
      let playlistId = '';

      if (host === 'youtu.be' || host === 'www.youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (
        ['youtube.com', 'www.youtube.com', 'm.youtube.com',
         'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)
      ) {
        if (url.pathname === '/watch') {
          videoId = url.searchParams.get('v') || '';
          playlistId = url.searchParams.get('list') || '';
        } else if (/^\/(embed|shorts)\//.test(url.pathname)) {
          videoId = url.pathname.split('/')[2] || '';
        } else if (url.pathname === '/playlist') {
          playlistId = url.searchParams.get('list') || '';
        }
      }

      if (playlistId && /^[A-Za-z0-9_-]+$/.test(playlistId)) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
          'https://' + 'www.youtube-nocookie.com/embed/videoseries?list=' +
          encodeURIComponent(playlistId) +
          '&autoplay=0&controls=1&rel=0'
        );
      }

      if (/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
          'https://' + 'www.youtube-nocookie.com/embed/' +
          videoId +
          '?autoplay=0&controls=1&rel=0&playsinline=1'
        );
      }
    } catch {
      // URL ไม่ถูกต้อง
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
  }

  formatReleaseDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
