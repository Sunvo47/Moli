import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService, Movie } from '../../services/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  allMovies: Movie[] = [];
  searchText = '';

  get filteredSearchResults(): Movie[] {
    const query = this.searchText.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return this.allMovies
      .filter((movie) =>
        [
          movie.title,
          movie.genre,
          movie.type,
          movie.description
        ].some((value) =>
          String(value ?? '').toLowerCase().includes(query)
        )
      )
      .slice(0, 6);
  }

  featuredMovie: Movie | null = null;
  trailerMovie: Movie | null = null;
  trendingMovies: Movie[] = [];
  newReleases: Movie[] = [];
  loading = true;
  error = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMovies();
  }


  loadMovies(): void {
    this.loading = true;
    this.error = '';

    this.api.getMovies().subscribe({
      next: (movies) => {
        this.allMovies = movies ?? [];

        // สุ่ม Hero Banner จากหนังจริงที่โหลดจาก API
        this.featuredMovie = this.allMovies.length
          ? this.allMovies[Math.floor(Math.random() * this.allMovies.length)]
          : null;

        this.trendingMovies = [...movies]
          .sort((a, b) => {
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }

            return b.viewCount - a.viewCount;
          })
          .slice(0, 6);

        this.newReleases = [...movies]
          .sort(
            (a, b) =>
              new Date(b.releaseDate).getTime() -
              new Date(a.releaseDate).getTime()
          )
          .slice(0, 10);

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: () => {
        this.loading = false;
        this.error = 'Unable to load movies. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }


  openFirstSearchResult(): void {
    const movie = this.filteredSearchResults[0];

    if (!movie) {
      return;
    }

    this.searchText = '';
    this.router.navigate(['/categories', movie.id]);
  }

  openTrailer(movie: Movie): void {
    if (movie.trailerUrl) {
      this.trailerMovie = movie;
    }
  }

  closeTrailer(): void {
    this.trailerMovie = null;
  }

  getTrailerEmbedUrl(value: string): SafeResourceUrl {
    let videoId = '';

    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();

      if (host === 'youtu.be' || host === 'www.youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (
        host === 'youtube.com' ||
        host === 'www.youtube.com' ||
        host === 'm.youtube.com' ||
        host === 'youtube-nocookie.com' ||
        host === 'www.youtube-nocookie.com'
      ) {
        if (url.pathname === '/watch') {
          videoId = url.searchParams.get('v') || '';
        } else if (/^\/(embed|shorts)\//.test(url.pathname)) {
          videoId = url.pathname.split('/')[2] || '';
        }
      }
    } catch {
      videoId = '';
    }

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube-nocookie.com/embed/' +
      videoId +
      '?autoplay=1&mute=1&controls=1&rel=0&playsinline=1'
    );
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
