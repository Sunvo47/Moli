import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService, Movie } from '../../services/api';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.css'
})
export class MovieDetail implements OnInit {
  movie: Movie | null = null;
  loading = true;
  error = '';
  liked = false;
  likeLoading = false;
  rentLoading = false;
  rentalMessage = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
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
      next: () => {
        this.rentLoading = false;
        this.rentalMessage =
          'Rental activated. You can watch this movie now.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.rentLoading = false;
        this.rentalMessage =
          error.status === 409
            ? 'You already have an active rental for this movie.'
            : 'Unable to rent this movie.';
        this.cdr.detectChanges();
      }
    });
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

  formatReleaseDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}