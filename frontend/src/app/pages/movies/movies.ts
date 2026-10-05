import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { ApiService, Movie } from '../../services/api';
@Component({
selector: 'app-movies',
standalone: true,
imports: [
FormsModule,
RouterLink
],
templateUrl: './movies.html',
styleUrl: './movies.css'
})
export class Movies implements OnInit {
movies: Movie[] = [];
likedMovieIds = new Set<number>();
searchText = '';
selectedGenre = 'All';
selectedType = 'All';
genres: string[] = [];
types: string[] = ['All', 'MOVIE', 'SERIES', 'ANIME'];
loading = true;
error = '';
likeLoadingIds = new Set<number>();
constructor(
private api: ApiService,
private router: Router,
private cdr: ChangeDetectorRef
) {}
ngOnInit(): void {
this.loadMovies();
}
loadMovies(): void {
this.loading = true;
this.error = '';
this.cdr.markForCheck();
this.api.getMovies().pipe(timeout(10000)).subscribe({
  next: (movies) => {
    this.movies = movies;

    this.genres = [
      'All',
      ...Array.from(
        new Set(
          movies
            .map((movie) => movie.genre)
            .filter((genre) => !!genre)
        )
      ).sort()
    ];

    this.loadLikedMovies();

    this.loading = false;
    this.cdr.detectChanges();
  },
  error: (error) => {
    console.error('Failed to load movies:', error);

    this.movies = [];
    this.loading = false;
    this.error = 'Unable to load movies. Please try again.';

    this.cdr.detectChanges();
  }
});
}
loadLikedMovies(): void {
const token = localStorage.getItem('moli_token');
if (!token) {
  this.likedMovieIds.clear();
  this.cdr.detectChanges();
  return;
}

this.api.getMyLikedMovies().subscribe({
  next: (likes) => {
    this.likedMovieIds = new Set(
      likes
        .map((like) => like.movie?.id ?? like.movieId)
        .filter((id): id is number => typeof id === 'number')
    );

    this.cdr.detectChanges();
  },
  error: (error) => {
    console.error('Failed to load liked movies:', error);
    this.likedMovieIds.clear();
    this.cdr.detectChanges();
  }
});
}
applyFilters(): void {
this.loading = true;
this.error = '';
this.cdr.markForCheck();
const search = this.searchText.trim();

this.api.getMovies(
  search || undefined,
  this.selectedGenre !== 'All'
    ? this.selectedGenre
    : undefined,
  this.selectedType !== 'All'
    ? this.selectedType
    : undefined
).pipe(timeout(10000)).subscribe({
  next: (movies) => {
    this.movies = movies;
    this.loading = false;

    this.loadLikedMovies();

    this.cdr.detectChanges();
  },
  error: (error) => {
    console.error('Failed to filter movies:', error);

    this.movies = [];
    this.loading = false;
    this.error = 'Unable to filter movies. Please try again.';

    this.cdr.detectChanges();
  }
});
}
clearFilters(): void {
this.searchText = '';
this.selectedGenre = 'All';
this.selectedType = 'All';
this.loadMovies();
}
isLiked(movieId: number): boolean {
return this.likedMovieIds.has(movieId);
}
toggleLike(event: MouseEvent, movie: Movie): void {
event.preventDefault();
event.stopPropagation();
const token = localStorage.getItem('moli_token');

if (!token) {
  this.router.navigate(['/login']);
  return;
}

if (this.likeLoadingIds.has(movie.id)) {
  return;
}

this.likeLoadingIds.add(movie.id);
this.cdr.detectChanges();

this.api.likeMovie(movie.id).subscribe({
  next: (result) => {
    if (result.liked) {
      this.likedMovieIds.add(movie.id);
    } else {
      this.likedMovieIds.delete(movie.id);
    }

    movie.likeCount = result.likeCount;

    this.likeLoadingIds.delete(movie.id);
    this.cdr.detectChanges();
  },
  error: (error) => {
    console.error('Failed to toggle like:', error);

    this.likeLoadingIds.delete(movie.id);
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
getImageUrl(value: string): string {
if (!value) {
return '';
}
const markdownMatch = value.match(
  /\]\((https?:\/\/[^)]+)\)/
);

if (markdownMatch) {
  return markdownMatch[1];
}

return value;
}
}