import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { TmdbApiService } from '../../core/services/tmdb-api.service';
import { Movie } from '../../core/models/movie.model';
import { SearchInputDirective } from '../../core/directives/search-input';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movie-details/movie-details-dialog/movie-details-dialog';
import { AddToCollectionDialog } from '../collections/add-to-collection-dialog/add-to-collection-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CollectionsService } from '../../core/services/collections';

type MovieWithFavoriteCount = Movie & { favoriteCount?: number };

@Component({
  selector: 'app-search',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchInputDirective,
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class SearchComponent implements OnDestroy, OnInit {
  private tmdbService = inject(TmdbApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private location = inject(Location);
  private collectionsService = inject(CollectionsService);
  selectedMovies: Movie[] = [];

  searchControl = new FormControl('', { updateOn: 'change' });
  movies: Movie[] = [];
  creatorSelections: MovieWithFavoriteCount[] = [];
  totalResults = 0;
  currentPage = 1;
  pageSize = 20;
  isLoading = false;
  currentQuery = '';
  imageBaseUrl = environment.tmdbImageBaseUrl;
  private readonly noImageFallbackSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eeeeee"/>
          <stop offset="1" stop-color="#dcdcdc"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="600" fill="url(#g)"/>
      <rect x="48" y="48" width="704" height="504" rx="28" ry="28" fill="none" stroke="#bdbdbd" stroke-width="10"/>
      <text x="400" y="325" font-size="44" font-family="Arial, sans-serif" text-anchor="middle" fill="#9e9e9e">No Image</text>
    </svg>
  `)}`;

  get showCreatorSelections(): boolean {
    return !this.isLoading && !(this.searchControl.value ?? '').trim();
  }

  private getFallbackPosterSrc(): string {
    // This is what the UI requests; if it doesn't exist in the project, the (error) handler will swap it.
    return '/assets/no-image-placeholder-DA-yB8fJ.png';
  }

  getPosterSrc(movie: Movie): string {
    return movie.poster_path ? this.imageBaseUrl + movie.poster_path : this.getFallbackPosterSrc();
  }

  onPosterImgError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) return;
    target.src = this.noImageFallbackSrc;
  }

  ngOnInit(): void {
    this.creatorSelections = this.buildCreatorSelections();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        const trimmed = value?.trim() ?? '';
        if (trimmed.length >= 3 && /^[a-zA-Z0-9 ]*$/.test(trimmed)) {
          this.currentQuery = trimmed;
          this.currentPage = 1;
          this.search();
        } else {
          this.movies = [];
          this.totalResults = 0;
          this.currentQuery = '';
          this.cdr.markForCheck();
        }
      });
  }

  private buildCreatorSelections(): MovieWithFavoriteCount[] {
    const collections = this.collectionsService.getCollections();
    const counts = new Map<number, { movie: Movie; count: number }>();

    for (const collection of collections) {
      for (const movie of collection.movies) {
        const existing = counts.get(movie.id);
        if (!existing) {
          counts.set(movie.id, { movie, count: 1 });
        } else {
          existing.count += 1;
        }
      }
    }

    const fromStorage = Array.from(counts.values())
      .map((v) => ({ ...v.movie, favoriteCount: v.count }))
      .sort((a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0));

    if (fromStorage.length > 0) return fromStorage.slice(0, 12);

    // Fallback when the user has no saved movies yet.
    // (IDs are common TMDB movies so clicking still tends to work.)
    return [
      {
        id: 27205, // Inception
        title: 'Inception',
        poster_path: '',
        vote_average: 8.3,
        overview: 'A thief steals corporate secrets through use of dream-sharing technology.',
        release_date: '2010-07-16',
        favoriteCount: 12,
      },
      {
        id: 155, // The Dark Knight
        title: 'The Dark Knight',
        poster_path: '',
        vote_average: 8.5,
        overview: 'Batman raises the stakes in his war on crime.',
        release_date: '2008-07-18',
        favoriteCount: 10,
      },
      {
        id: 603, // The Matrix
        title: 'The Matrix',
        poster_path: '',
        vote_average: 8.7,
        overview: 'A computer hacker learns about the true nature of his reality.',
        release_date: '1999-03-31',
        favoriteCount: 8,
      },
      {
        id: 680, // Pulp Fiction
        title: 'Pulp Fiction',
        poster_path: '',
        vote_average: 8.9,
        overview: 'The lives of two mob hitmen intertwine in four tales of violence.',
        release_date: '1994-10-14',
        favoriteCount: 7,
      },
    ];
  }

  search(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.tmdbService
      .searchMovies(this.currentQuery, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.movies = response.results;
          this.totalResults = response.total_results;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.search();
  }

  onPosterKeydown(event: Event, movieId: number): void {
    const ke = event as KeyboardEvent;
    if (ke.key !== 'Enter' && ke.key !== ' ') {
      return;
    }
    ke.preventDefault();
    this.onMovieClick(movieId);
  }

  onMovieClick(movieId: number): void {
    this.tmdbService.getMovieDetails(movieId).subscribe((movie) => {
      this.location.go(`/movie/${movieId}`);
      const dialogRef = this.dialog.open(MovieDetailsDialogComponent, {
        width: '1020px',
        maxHeight: '95vh',
        data: { movie },
      });

      dialogRef.afterClosed().subscribe(() => {
        this.location.go('/');
      });
    });
  }

  toggleMovieSelection(event: Event, movie: Movie): void {
    event.stopPropagation();
    const index = this.selectedMovies.findIndex((m) => m.id === movie.id);
    if (index === -1) {
      this.selectedMovies.push(movie);
    } else {
      this.selectedMovies.splice(index, 1);
    }
  }

  isSelected(movieId: number): boolean {
    return this.selectedMovies.some((m) => m.id === movieId);
  }

  openAddToCollection(): void {
    const ref = this.dialog.open(AddToCollectionDialog, {
      width: '500px',
      data: { movies: this.selectedMovies },
    });

    ref.afterClosed().subscribe(() => {
      // Update creator selection favorite counts after adding movies to collections.
      this.creatorSelections = this.buildCreatorSelections();
      this.cdr.markForCheck();
    });
  }

  getErrorMessage(): string | null {
    if (!this.searchControl.touched) return null;
    const value = this.searchControl.value;
    if (!value) return null;
    if (value.length < 3) return 'Minimum 3 characters required';
    if (!/^[a-zA-Z0-9 ]*$/.test(value)) return 'Only letters and numbers allowed';
    return null;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchControl.markAsUntouched();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
