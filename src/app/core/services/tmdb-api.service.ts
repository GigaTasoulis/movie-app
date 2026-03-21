import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovieDetails, MovieSearchResponse, GuestSession, RatingResponse } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class TmdbApiService {
  private http = inject(HttpClient);
  private apiKey = environment.tmdbApiKey;
  private baseUrl = environment.tmdbBaseUrl;

  searchMovies(query: string, page: number = 1): Observable<MovieSearchResponse> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('query', query)
      .set('page', page.toString());

    return this.http.get<MovieSearchResponse>(`${this.baseUrl}/search/movie`, { params });
  }

  getMovieDetails(movieId: number): Observable<MovieDetails> {
    const params = new HttpParams()
      .set('api_key', this.apiKey);

    return this.http.get<MovieDetails>(`${this.baseUrl}/movie/${movieId}`, { params });
  }

  createGuestSession(): Observable<GuestSession> {
    const params = new HttpParams()
      .set('api_key', this.apiKey);

    return this.http.get<GuestSession>(`${this.baseUrl}/authentication/guest_session/new`, { params });
  }

  rateMovie(movieId: number, rating: number, guestSessionId: string): Observable<RatingResponse> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('guest_session_id', guestSessionId);

    return this.http.post<RatingResponse>(
      `${this.baseUrl}/movie/${movieId}/rating`,
      { value: rating },
      { params }
    );
  }
}