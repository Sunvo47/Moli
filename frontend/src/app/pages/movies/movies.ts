import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
allMovies: Movie[] = [];
pageSize = 15;
currentPage = 1;

get totalPages(): number {
  return Math.max(1, Math.ceil(this.movies.length / this.pageSize));
}

get paginatedMovies(): Movie[] {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.movies.slice(start, start + this.pageSize);
}

get pageNumbers(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

setPage(page: number): void {
  if (page < 1 || page > this.totalPages) return;
  this.currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
movies: Movie[] = [];
likedMovieIds = new Set<number>();
searchText = '';

get filteredSearchResults(): Movie[] {
  const query = this.searchText.trim().toLowerCase();
  if (!query) return [];

  return this.allMovies
    .map((movie, index) => {
      const title = String(movie.title ?? '').toLowerCase();
      return {
        movie,
        index,
        starts: title.startsWith(query),
        matches: title.includes(query)
      };
    })
    .filter(item => item.matches)
    .sort((a, b) =>
      Number(b.starts) - Number(a.starts) ||
      a.movie.title.localeCompare(b.movie.title) ||
      a.index - b.index
    )
    .slice(0, 6)
    .map(item => item.movie);
}

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
private route: ActivatedRoute,
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
    this.allMovies = movies;
    this.movies = movies;
    this.currentPage = 1;

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

    const requestedGenre = this.route.snapshot.queryParamMap.get('genre')?.trim();

if (requestedGenre) {
  const matchingGenre = this.genres.find(
    genre => genre.toLowerCase() === requestedGenre.toLowerCase()
  );

  if (matchingGenre) {
    this.selectedGenre = matchingGenre;
    this.applyFilters();
    return;
  }
}

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
    this.currentPage = 1;
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

this.router.navigate([], {
  relativeTo: this.route,
  queryParams: { genre: null },
  queryParamsHandling: 'merge',
  replaceUrl: true
}).then(() => {
  this.loadMovies();
});
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