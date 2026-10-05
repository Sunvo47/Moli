import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timeout, finalize } from 'rxjs';
import { ApiService, Movie } from '../../services/api';

interface MovieForm {
title: string;
description: string;
poster: string;
backdrop: string;
type: string;
genre: string;
duration: number | null;
rating: number | null;
rentalPrice: number | null;
rentalDuration: number | null;
releaseDate: string;
}

interface MoviePayload {
title: string;
description: string;
poster: string;
backdrop: string;
type: string;
genre: string;
duration: number;
rating: number;
rentalPrice: number;
rentalDuration: number;
releaseDate: string;
}

@Component({
selector: 'app-admin',
standalone: true,
imports: [FormsModule],
templateUrl: './admin.html',
styleUrl: './admin.css'
})
export class Admin implements OnInit {
movies: Movie[] = [];

loading = true;
saving = false;

error = '';
success = '';

editingId: number | null = null;

form: MovieForm = this.createEmptyForm();

constructor(private api: ApiService) {}

ngOnInit(): void {
this.loadMovies();
}

createEmptyForm(): MovieForm {
return {
title: '',
description: '',
poster: '',
backdrop: '',
type: 'Movie',
genre: '',
duration: null,
rating: null,
rentalPrice: null,
rentalDuration: null,
releaseDate: ''
};
}

loadMovies(): void {
this.loading = true;
this.error = '';

this.api.getMovies().subscribe({
next: (movies) => {
this.movies = movies;
this.loading = false;
},
error: () => {
this.loading = false;
this.error = 'Unable to load movies.';
}
});

}

startAdd(): void {
this.editingId = null;
this.form = this.createEmptyForm();

this.error = '';
this.success = '';

}

startEdit(movie: Movie): void {
this.editingId = movie.id;

this.form = {
title: movie.title,
description: movie.description,
poster: this.getImageUrl(movie.poster),
backdrop: this.getImageUrl(movie.backdrop),
type: movie.type,
genre: movie.genre,
duration: movie.duration,
rating: movie.rating,
rentalPrice: movie.rentalPrice,
rentalDuration: movie.rentalDuration,
releaseDate: this.formatDateForInput(movie.releaseDate)
};

this.error = '';
this.success = '';

window.scrollTo({
top: 0,
behavior: 'smooth'
});

}

cancelEdit(): void {
this.editingId = null;
this.form = this.createEmptyForm();

this.error = '';
this.success = '';
this.saving = false;

}

saveMovie(): void {
if (this.saving) {
return;
}

this.error = '';
this.success = '';

const validationError = this.validateForm();

if (validationError) {
this.error = validationError;
return;
}

const payload: MoviePayload = {
title: this.form.title.trim(),
description: this.form.description.trim(),
poster: this.cleanUrl(this.form.poster),
backdrop: this.cleanUrl(this.form.backdrop),
type: this.form.type,
genre: this.form.genre.trim(),
duration: Number(this.form.duration),
rating: Number(this.form.rating),
rentalPrice: Number(this.form.rentalPrice),
rentalDuration: Number(this.form.rentalDuration),
releaseDate: this.form.releaseDate
};

this.saving = true;

if (this.editingId === null) {
this.createMovie(payload);
return;
}

this.updateMovie(this.editingId, payload);

}

createMovie(payload: MoviePayload): void {
this.api.createMovie(payload)
.pipe(
timeout(10000),
finalize(() => {
this.saving = false;
})
)
.subscribe({
next: (movie) => {
this.movies = [movie, ...this.movies];

  this.success = 'Movie added successfully.';

  this.editingId = null;
  this.form = this.createEmptyForm();
},

error: (err: any) => {
  if (err?.name === 'TimeoutError') {
    this.error = 'The server took too long to respond.';
    return;
  }

  this.error =
    err?.error?.message ??
    'Unable to add movie. Please try again.';
}

});

}

updateMovie(
movieId: number,
payload: MoviePayload
): void {
this.api.updateMovie(movieId, payload)
.pipe(
timeout(10000),
finalize(() => {
this.saving = false;
})
)
.subscribe({
next: (updatedMovie) => {
this.movies = this.movies.map(
(movie) =>
movie.id === movieId
? updatedMovie
: movie
);

  this.success = 'Movie updated successfully.';

  this.editingId = null;
  this.form = this.createEmptyForm();
},

error: (err: any) => {
  if (err?.name === 'TimeoutError') {
    this.error = 'The server took too long to respond.';
    return;
  }

  this.error =
    err?.error?.message ??
    'Unable to update movie. Please try again.';
}

});

}

deleteMovie(movie: Movie): void {
const confirmed = window.confirm(
`Delete "${movie.title}"? This action cannot be undone.`
);

if (!confirmed) {
return;
}

this.error = '';
this.success = '';

this.api.deleteMovie(movie.id).subscribe({
next: () => {
this.movies = this.movies.filter(
(item) => item.id !== movie.id
);

if (this.editingId === movie.id) {
  this.cancelEdit();
}

this.success = 'Movie deleted successfully.';

},

error: (err: any) => {
this.error =
err?.error?.message ??
'Unable to delete movie. It may still be referenced by other data.';
}
});

}

validateForm(): string {
if (!this.form.title.trim()) {
return 'Movie title is required.';
}

if (this.form.title.trim().length < 2) {
return 'Movie title must be at least 2 characters.';
}

if (!this.form.description.trim()) {
return 'Description is required.';
}

if (!this.form.poster.trim()) {
return 'Poster URL is required.';
}

if (!this.form.backdrop.trim()) {
return 'Backdrop URL is required.';
}

if (!this.form.genre.trim()) {
return 'Genre is required.';
}

if (
this.form.duration === null ||
this.form.duration <= 0
) {
return 'Duration must be greater than 0.';
}

if (
this.form.rating === null ||
this.form.rating < 0 ||
this.form.rating > 10
) {
return 'Rating must be between 0 and 10.';
}

if (
this.form.rentalPrice === null ||
this.form.rentalPrice < 0
) {
return 'Rental price cannot be negative.';
}

if (
this.form.rentalDuration === null ||
this.form.rentalDuration <= 0
) {
return 'Rental duration must be greater than 0.';
}

if (!this.form.releaseDate) {
return 'Release date is required.';
}

return '';

}

cleanUrl(value: string): string {
if (!value) {
return '';
}

const markdownMatch =
value.match(/]\((https?:\/\/[^)]+)\)/);

if (markdownMatch) {
return markdownMatch[1];
}

if (
value.startsWith('[') &&
value.endsWith(')')
) {
const match =
value.match(/\((https?:\/\/[^\)]+)]/);

if (match) {
return match[1];
}
}

return value.trim();

}

getImageUrl(value: string | undefined): string {
return this.cleanUrl(value ?? '');
}

formatDateForInput(value: string): string {
if (!value) {
return '';
}

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return '';
}

const year = date.getFullYear();

const month = String(
date.getMonth() + 1
).padStart(2, '0');

const day = String(date.getDate()).padStart(2, '0');

return `${year}-${month}-${day}`;

}
}
