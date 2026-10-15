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

likedMoviesPage = 1;
likedMoviesPageSize = 15;

rentalsPage = 1;
rentalsPageSize = 6;

watchHistoryPage = 1;
watchHistoryPageSize = 6;

get rentalsTotalPages(): number {
  return Math.ceil(this.rentals.length / this.rentalsPageSize);
}

get paginatedRentals(): Rental[] {
  const start = (this.rentalsPage - 1) * this.rentalsPageSize;
  return this.rentals.slice(start, start + this.rentalsPageSize);
}

get rentalsPageNumbers(): number[] {
  return Array.from({ length: this.rentalsTotalPages }, (_, i) => i + 1);
}

setRentalsPage(page: number): void {
  if (page < 1 || page > this.rentalsTotalPages || page === this.rentalsPage) {
    return;
  }
  this.rentalsPage = page;
  this.cdr.detectChanges();
}

get watchHistoryTotalPages(): number {
  return Math.ceil(this.watchHistory.length / this.watchHistoryPageSize);
}

get paginatedWatchHistory(): WatchHistory[] {
  const start = (this.watchHistoryPage - 1) * this.watchHistoryPageSize;
  return this.watchHistory.slice(start, start + this.watchHistoryPageSize);
}

get watchHistoryPageNumbers(): number[] {
  return Array.from({ length: this.watchHistoryTotalPages }, (_, i) => i + 1);
}

setWatchHistoryPage(page: number): void {
  if (
    page < 1 ||
    page > this.watchHistoryTotalPages ||
    page === this.watchHistoryPage
  ) {
    return;
  }
  this.watchHistoryPage = page;
  this.cdr.detectChanges();
}

get likedMoviesTotalPages(): number {
return Math.ceil(this.likedMovies.length / this.likedMoviesPageSize);
}

get paginatedLikedMovies(): any[] {
const start = (this.likedMoviesPage - 1) * this.likedMoviesPageSize;
return this.likedMovies.slice(start, start + this.likedMoviesPageSize);
}

get likedMoviesPageNumbers(): number[] {
return Array.from(
{ length: this.likedMoviesTotalPages },
(_, index) => index + 1
);
}

setLikedMoviesPage(page: number): void {
if (
page < 1 ||
page > this.likedMoviesTotalPages ||
page === this.likedMoviesPage
) {
return;
}

this.likedMoviesPage = page;
this.cdr.detectChanges();
}


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
    this.likedMoviesPage = 1;
    finishRequest();
  },
  error: (error) => {
    console.error('Failed to load My List:', error);
    this.likedMovies = [];
    this.likedMoviesPage = 1;
    failed++;
    finishRequest();
  }
});

this.api.getMyRentals().subscribe({
  next: (rentals) => {
    this.rentals = rentals ?? [];
    this.rentalsPage = 1;
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
    this.watchHistoryPage = 1;
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
