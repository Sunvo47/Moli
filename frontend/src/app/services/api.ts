import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Movie {
id: number;
title: string;
description: string;
poster: string;
backdrop?: string;
type: string;
genre: string;
duration: number;
rating: number;
rentalPrice: number;
rentalDuration: number;
releaseDate: string;
viewCount: number;
likeCount: number;
createdAt?: string;
updatedAt?: string;
}

export interface Reel {
id: number;
title: string;
description?: string;
videoUrl: string;
thumbnail?: string;
viewCount: number;
likeCount: number;
movieId?: number;
createdBy?: number;
createdAt?: string;
updatedAt?: string;
movie: {
id: number;
title: string;
poster: string;
genre: string;
rating: number;
};
}

export interface Rental {
id: number;
userId: number;
movieId: number;
rentedAt: string;
expiresAt: string;
status: string;
price: number;
movie: Movie;
}

export interface RentalResponse {
message: string;
rental: Rental;
}

export interface LikeStatus {
liked: boolean;
likeCount: number;
}

export interface MyListStatus {
saved: boolean;
}

export interface MyListItem {
id: number;
userId: number;
movieId: number;
createdAt: string;
movie: Movie;
}

export interface WatchHistory {
id: number;
userId: number;
movieId: number;
watchedAt: string;
movie: Movie;
}

export interface Profile {
id: number;
name: string;
email: string;
role: string;
profileImage?: string | null;
createdAt?: string;
updatedAt?: string;
}

@Injectable({
providedIn: 'root'
})
export class ApiService {
private baseUrl = 'http://localhost:3000/api';

constructor(private http: HttpClient) {}

private authHeaders(): HttpHeaders {
const token = localStorage.getItem('moli_token');

return new HttpHeaders({
  Authorization: `Bearer ${token}`
});

}

// =========================
// MOVIES
// =========================

getMovies(
search?: string,
genre?: string,
type?: string
): Observable<Movie[]> {
let params = new HttpParams();

if (search) {
  params = params.set('search', search);
}

if (genre) {
  params = params.set('genre', genre);
}

if (type) {
  params = params.set('type', type);
}

return this.http.get<Movie[]>(
  `${this.baseUrl}/movies`,
  { params }
);

}

getMovie(id: number): Observable<Movie> {
return this.http.get<Movie>(
`${this.baseUrl}/movies/${id}`
);
}

createMovie(movie: Partial<Movie>): Observable<Movie> {
return this.http.post<Movie>(
`${this.baseUrl}/movies`,
movie,
{
headers: this.authHeaders()
}
);
}

updateMovie(
id: number,
movie: Partial<Movie>
): Observable<Movie> {
return this.http.put<Movie>(
`${this.baseUrl}/movies/${id}`,
movie,
{
headers: this.authHeaders()
}
);
}

deleteMovie(id: number): Observable<void> {
return this.http.delete<void>(
`${this.baseUrl}/movies/${id}`,
{
headers: this.authHeaders()
}
);
}

// =========================
// AUTH
// =========================

register(
name: string,
email: string,
password: string
): Observable<any> {
return this.http.post<any>(
`${this.baseUrl}/auth/register`,
{
name,
email,
password
}
);
}

login(
email: string,
password: string
): Observable<any> {
return this.http.post<any>(
`${this.baseUrl}/auth/login`,
{
email,
password
}
);
}

resetPassword(
email: string,
newPassword: string
): Observable<any> {
return this.http.post<any>(
`${this.baseUrl}/auth/reset-password`,
{
email,
newPassword
}
);
}

// =========================
// PROFILE
// =========================

getProfile(): Observable<Profile> {
return this.http.get<Profile>(
`${this.baseUrl}/profile/me`,
{
headers: this.authHeaders()
}
);
}

updateProfile(data: {
name?: string;
profileImage?: string | null;
}): Observable<Profile> {
return this.http.put<Profile>(
`${this.baseUrl}/profile/me`,
data,
{
headers: this.authHeaders()
}
);
}

updateEmail(
email: string,
currentPassword: string
): Observable<any> {
return this.http.put<any>(
`${this.baseUrl}/profile/email`,
{
email,
currentPassword
},
{
headers: this.authHeaders()
}
);
}

updatePassword(
currentPassword: string,
newPassword: string
): Observable<any> {
return this.http.put<any>(
`${this.baseUrl}/profile/password`,
{
currentPassword,
newPassword
},
{
headers: this.authHeaders()
}
);
}

// =========================
// RENTALS
// =========================

rentMovie(movieId: number): Observable<RentalResponse> {
return this.http.post<RentalResponse>(
`${this.baseUrl}/rentals`,
{ movieId },
{
headers: this.authHeaders()
}
);
}

getMyRentals(): Observable<Rental[]> {
const params = new HttpParams().set(
'_t',
Date.now().toString()
);

console.log('API: getMyRentals() called');

return this.http.get<Rental[]>(
  `${this.baseUrl}/rentals/my`,
  {
    headers: this.authHeaders(),
    params
  }
).pipe(
  tap({
    next: (data) => {
      console.log(
        'API: getMyRentals() NEXT:',
        data
      );
    },
    error: (error) => {
      console.error(
        'API: getMyRentals() ERROR:',
        error
      );
    },
    complete: () => {
      console.log(
        'API: getMyRentals() COMPLETE'
      );
    }
  })
);

}

// =========================
// LIKES
// =========================

likeMovie(movieId: number): Observable<LikeStatus> {
return this.http.post<LikeStatus>(
`${this.baseUrl}/likes/${movieId}`,
{},
{
headers: this.authHeaders()
}
);
}

getMovieLike(movieId: number): Observable<LikeStatus> {
return this.http.get<LikeStatus>(
`${this.baseUrl}/likes/${movieId}`,
{
headers: this.authHeaders()
}
);
}

getMyLikedMovies(): Observable<any[]> {
return this.http.get<any[]>(
`${this.baseUrl}/likes/my`,
{
headers: this.authHeaders()
}
);
}

// =========================
// MY LIST
// =========================

addToMyList(movieId: number): Observable<MyListStatus> {
return this.http.post<MyListStatus>(
`${this.baseUrl}/my-list/${movieId}`,
{},
{
headers: this.authHeaders()
}
);
}

removeFromMyList(movieId: number): Observable<MyListStatus> {
return this.http.delete<MyListStatus>(
`${this.baseUrl}/my-list/${movieId}`,
{
headers: this.authHeaders()
}
);
}

getMyListStatus(movieId: number): Observable<MyListStatus> {
return this.http.get<MyListStatus>(
`${this.baseUrl}/my-list/${movieId}`,
{
headers: this.authHeaders()
}
);
}

getMyList(): Observable<MyListItem[]> {
return this.http.get<MyListItem[]>(
`${this.baseUrl}/my-list/my`,
{
headers: this.authHeaders()
}
);
}

// =========================
// WATCH HISTORY
// =========================

checkWatchPermission(movieId: number): Observable<any> {
return this.http.get<any>(
`${this.baseUrl}/watch-history/check/${movieId}`,
{
headers: this.authHeaders()
}
);
}

addWatchHistory(movieId: number): Observable<WatchHistory> {
return this.http.post<WatchHistory>(
`${this.baseUrl}/watch-history/${movieId}`,
{},
{
headers: this.authHeaders()
}
);
}

getWatchHistory(): Observable<WatchHistory[]> {
return this.http.get<WatchHistory[]>(
`${this.baseUrl}/watch-history/my`,
{
headers: this.authHeaders()
}
);
}

// =========================
// REELS
// =========================

getReels(): Observable<Reel[]> {
return this.http.get<Reel[]>(
`${this.baseUrl}/reels`
);
}

getReel(id: number): Observable<Reel> {
return this.http.get<Reel>(
`${this.baseUrl}/reels/${id}`
);
}

recordReelView(id: number): Observable<any> {
return this.http.post<any>(
`${this.baseUrl}/reels/${id}/view`,
{}
);
}

getReelLike(id: number): Observable<any> {
return this.http.get<any>(
`${this.baseUrl}/reels/${id}/like`
);
}

likeReel(id: number): Observable<any> {
return this.http.post<any>(
`${this.baseUrl}/reels/${id}/like`,
{},
{
headers: this.authHeaders()
}
);
}
}
