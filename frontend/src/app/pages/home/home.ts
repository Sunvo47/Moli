import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Movie } from '../../services/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  featuredMovie: Movie | null = null;
  trendingMovies: Movie[] = [];
  newReleases: Movie[] = [];
  loading = true;
  error = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    this.error = '';

    this.api.getMovies().subscribe({
      next: (movies) => {
        this.featuredMovie = movies[0] ?? null;

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

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
