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

  private movieDetailsCache = new Map<number, Observable<MovieDetails>>();
  private searchCache = new Map<string, Observable<MovieSearchResponse>>();

  searchMovies(
    query: string,
    page: number = 1,
    filters?: MovieFilters
  ): Observable<MovieSearchResponse> {
    const key = `search:${query}:${page}:${this.filtersKey(filters)}`;
    if (!this.searchCache.has(key)) {
      let params = new HttpParams()
        .set('api_key', this.apiKey)
        .set('query', query)
        .set('page', page.toString());

      if (filters?.yearMin)
        params = params.set('primary_release_date.gte', `${filters.yearMin}-01-01`);
      if (filters?.yearMax)
        params = params.set('primary_release_date.lte', `${filters.yearMax}-12-31`);
      if (filters?.language) params = params.set('with_original_language', filters.language);

      this.searchCache.set(
        key,
        this.http
          .get<MovieSearchResponse>(`${this.baseUrl}/search/movie`, { params })
          .pipe(shareReplay(1))
      );
    }
    return this.searchCache.get(key)!;
  }

  discoverMovies(page: number = 1, filters?: MovieFilters): Observable<MovieSearchResponse> {
    const key = `discover:${page}:${this.filtersKey(filters)}`;
    if (!this.searchCache.has(key)) {
      let params = new HttpParams()
        .set('api_key', this.apiKey)
        .set('page', page.toString())
        .set('sort_by', 'popularity.desc');

      if (filters?.genreIds?.length) params = params.set('with_genres', filters.genreIds.join(','));
      if (filters?.yearMin)
        params = params.set('primary_release_date.gte', `${filters.yearMin}-01-01`);
      if (filters?.yearMax)
        params = params.set('primary_release_date.lte', `${filters.yearMax}-12-31`);
      if (filters?.language) params = params.set('with_original_language', filters.language);

      this.searchCache.set(
        key,
        this.http
          .get<MovieSearchResponse>(`${this.baseUrl}/discover/movie`, { params })
          .pipe(shareReplay(1))
      );
    }
    return this.searchCache.get(key)!;
  }

  private filtersKey(filters?: MovieFilters): string {
    if (!filters) return '';
    return `${filters.genreIds.join('-')}|${filters.yearMin ?? ''}|${filters.yearMax ?? ''}|${filters.language ?? ''}`;
  }

  getGenres(): Observable<{ genres: Genre[] }> {
    return this.genres$;
  }

  getMovieDetails(movieId: number): Observable<MovieDetails> {
    if (!this.movieDetailsCache.has(movieId)) {
      const params = new HttpParams().set('api_key', this.apiKey);
      const request$ = this.http
        .get<MovieDetails>(`${this.baseUrl}/movie/${movieId}`, { params })
        .pipe(shareReplay(1));
      this.movieDetailsCache.set(movieId, request$);
    }
    return this.movieDetailsCache.get(movieId)!;
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
