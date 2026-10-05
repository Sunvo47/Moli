import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Movie } from '../../services/api';

@Component({
selector: 'app-watch',
standalone: true,
imports: [RouterLink],
templateUrl: './watch.html',
styleUrl: './watch.css'
})
export class Watch implements OnInit {
movie: Movie | null = null;

loading = true;
error = '';

canWatch = false;
checkingRental = false;

rentalExpiresAt: string | null = null;

watchedThisSession = false;
recordingWatch = false;

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
  next: (movie: Movie) => {
    this.movie = movie;
    this.loading = false;

    this.cdr.detectChanges();

    this.checkRental(id);
  },
  error: () => {
    this.loading = false;
    this.error = 'Unable to load this movie.';
    this.cdr.detectChanges();
  }
});


}

checkRental(movieId: number): void {
const token = localStorage.getItem('moli_token');


if (!token) {
  this.checkingRental = false;
  this.canWatch = false;
  this.cdr.detectChanges();
  return;
}

this.checkingRental = true;
this.cdr.detectChanges();

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

onPlay(): void {
if (
!this.movie ||
!this.canWatch ||
this.watchedThisSession ||
this.recordingWatch
) {
return;
}


this.recordingWatch = true;
this.cdr.detectChanges();

this.api.addWatchHistory(this.movie.id).subscribe({
  next: (result: any) => {
    this.watchedThisSession = true;
    this.recordingWatch = false;

    if (this.movie && typeof result.viewCount === 'number') {
      this.movie = {
        ...this.movie,
        viewCount: result.viewCount
      };
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
if (!date) {
return '';
}


const parsed = new Date(date);

if (Number.isNaN(parsed.getTime())) {
  return '';
}

return parsed.toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});


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
}
