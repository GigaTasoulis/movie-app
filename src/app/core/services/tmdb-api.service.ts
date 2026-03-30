import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Genre,
  MovieDetails,
  MovieFilters,
  MovieSearchResponse,
  GuestSession,
  RatingResponse,
} from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class TmdbApiService {
  private http = inject(HttpClient);
  private apiKey = environment.tmdbApiKey;
  private baseUrl = environment.tmdbBaseUrl;
  private genres$ = this.http
    .get<{ genres: Genre[] }>(`${this.baseUrl}/genre/movie/list`, {
      params: new HttpParams().set('api_key', this.apiKey),
    })
    .pipe(shareReplay(1));

  searchMovies(query: string, page: number = 1, filters?: MovieFilters): Observable<MovieSearchResponse> {
    let params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('query', query)
      .set('page', page.toString());

    if (filters?.yearMin) params = params.set('primary_release_date.gte', `${filters.yearMin}-01-01`);
    if (filters?.yearMax) params = params.set('primary_release_date.lte', `${filters.yearMax}-12-31`);
    if (filters?.language) params = params.set('with_original_language', filters.language);

    return this.http.get<MovieSearchResponse>(`${this.baseUrl}/search/movie`, { params });
  }

  discoverMovies(page: number = 1, filters?: MovieFilters): Observable<MovieSearchResponse> {
    let params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('page', page.toString())
      .set('sort_by', 'popularity.desc');

    if (filters?.genreIds?.length) params = params.set('with_genres', filters.genreIds.join(','));
    if (filters?.yearMin) params = params.set('primary_release_date.gte', `${filters.yearMin}-01-01`);
    if (filters?.yearMax) params = params.set('primary_release_date.lte', `${filters.yearMax}-12-31`);
    if (filters?.language) params = params.set('with_original_language', filters.language);

    return this.http.get<MovieSearchResponse>(`${this.baseUrl}/discover/movie`, { params });
  }

  getGenres(): Observable<{ genres: Genre[] }> {
    return this.genres$;
  }

  getMovieDetails(movieId: number): Observable<MovieDetails> {
    const params = new HttpParams().set('api_key', this.apiKey);

    return this.http.get<MovieDetails>(`${this.baseUrl}/movie/${movieId}`, { params });
  }

  createGuestSession(): Observable<GuestSession> {
    const params = new HttpParams().set('api_key', this.apiKey);

    return this.http.get<GuestSession>(`${this.baseUrl}/authentication/guest_session/new`, {
      params,
    });
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
