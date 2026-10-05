import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Rental, WatchHistory } from '../../services/api';

@Component({
selector: 'app-library',
standalone: true,
imports: [DatePipe, RouterLink],
templateUrl: './library.html',
styleUrl: './library.css'
})
export class Library implements OnInit {

rentals: Rental[] = [];
watchHistory: WatchHistory[] = [];
likedMovies: any[] = [];

loading = false;
error = '';

constructor(
private api: ApiService,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.loadLibrary();
}

loadLibrary(): void {
const token = localStorage.getItem('moli_token');

if (!token) {
  this.loading = false;
  return;
}

this.loading = true;
this.error = '';

let completed = 0;
let failed = 0;

const finishRequest = () => {
  completed++;

  if (completed === 3) {
    this.loading = false;

    if (failed === 3) {
      this.error = 'Unable to load your library.';
    }

    this.cdr.detectChanges();
  }
};

this.api.getMyLikedMovies().subscribe({
  next: (likedMovies) => {
    this.likedMovies = likedMovies ?? [];
    finishRequest();
  },
  error: (error) => {
    console.error('Failed to load My List:', error);
    this.likedMovies = [];
    failed++;
    finishRequest();
  }
});

this.api.getMyRentals().subscribe({
  next: (rentals) => {
    this.rentals = rentals ?? [];
    finishRequest();
  },
  error: (error) => {
    console.error('Failed to load rentals:', error);
    this.rentals = [];
    failed++;
    finishRequest();
  }
});

this.api.getWatchHistory().subscribe({
  next: (history) => {
    this.watchHistory = history ?? [];
    finishRequest();
  },
  error: (error) => {
    console.error('Failed to load watch history:', error);
    this.watchHistory = [];
    failed++;
    finishRequest();
  }
});

}

hasToken(): boolean {
return !!localStorage.getItem('moli_token');
}

getImageUrl(value: string): string {
if (!value) {
return '';
}

const markdownMatch = value.match(/\]\((https?:\/\/[^)]+)\)/);

if (markdownMatch) {
  return markdownMatch[1];
}

return value;

}

isRentalActive(rental: Rental): boolean {
return (
rental.status === 'ACTIVE' &&
new Date(rental.expiresAt).getTime() > Date.now()
);
}

getRentalStatus(rental: Rental): string {
return this.isRentalActive(rental) ? 'ACTIVE' : 'EXPIRED';
}

getRemainingTime(rental: Rental): string {
const difference =
new Date(rental.expiresAt).getTime() - Date.now();

if (difference <= 0) {
  return 'Expired';
}

const totalHours = Math.floor(
  difference / (1000 * 60 * 60)
);

const days = Math.floor(totalHours / 24);
const hours = totalHours % 24;

if (days > 0) {
  return `${days}d ${hours}h remaining`;
}

return `${hours}h remaining`;

}

getLikedMovie(like: any): any {
return like.movie ?? like;
}

trackByRental(_index: number, rental: Rental): number {
return rental.id;
}

trackByHistory(_index: number, history: WatchHistory): number {
return history.id;
}

trackByLikedMovie(_index: number, like: any): number {
return like.id ?? like.movie?.id;
}

}
