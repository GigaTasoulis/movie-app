import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TmdbApiService } from '../../core/services/tmdb-api.service';
import { Movie, MovieDetails } from '../../core/models/movie.model';
import { SearchInputDirective } from '../../core/directives/search-input';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movie-details/movie-details-dialog/movie-details-dialog';
import { AddToCollectionDialog } from '../collections/add-to-collection-dialog/add-to-collection-dialog';
import { MovieFiltersDialog } from './movie-filters-dialog/movie-filters-dialog';
import { SelectionTrayComponent } from './selection-tray/selection-tray';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CollectionsService } from '../../core/services/collections';
import { MovieFilters } from '../../core/models/movie.model';

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
    SelectionTrayComponent,
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
  private platformId = inject(PLATFORM_ID);
  private readonly creatorSelectionsStorageKey = 'creator_selections_movie_ids';
  private usingSavedCreatorSelections = false;
  private savedCreatorSelectionIds: number[] | null = null;
  creatorViewMode: 'grid' | 'list' = 'grid';
  private readonly creatorViewModeStorageKey = 'creator_view_mode';
  resultsViewMode: 'grid' | 'list' = 'grid';
  private readonly resultsViewModeStorageKey = 'results_view_mode';
  selectedMovies: Movie[] = [];

  activeFilters: MovieFilters = { genreIds: [], yearMin: null, yearMax: null, language: '' };

  get hasActiveFilters(): boolean {
    return (
      this.activeFilters.genreIds.length > 0 ||
      this.activeFilters.yearMin !== null ||
      this.activeFilters.yearMax !== null ||
      !!this.activeFilters.language
    );
  }

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
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a1e2e"/>
          <stop offset="100%" stop-color="#0d1117"/>
        </linearGradient>
      </defs>
      <rect width="500" height="750" fill="url(#bg)"/>
      <!-- film strip holes top -->
      <rect x="20" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="76" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="132" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="188" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="244" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="300" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="356" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="412" y="18" width="36" height="26" rx="5" fill="#2a2f42"/>
      <!-- film strip holes bottom -->
      <rect x="20" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="76" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="132" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="188" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="244" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="300" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="356" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <rect x="412" y="706" width="36" height="26" rx="5" fill="#2a2f42"/>
      <!-- camera icon -->
      <rect x="155" y="290" width="190" height="130" rx="14" fill="none" stroke="#3a4058" stroke-width="8"/>
      <circle cx="250" cy="355" r="38" fill="none" stroke="#3a4058" stroke-width="8"/>
      <circle cx="250" cy="355" r="20" fill="#3a4058"/>
      <rect x="215" y="275" width="40" height="20" rx="6" fill="#3a4058"/>
      <!-- label -->
      <text x="250" y="490" font-size="22" font-family="Arial, sans-serif" font-weight="600"
        text-anchor="middle" fill="#4a5068" letter-spacing="2">NO IMAGE</text>
    </svg>
  `)}`;

  get showCreatorSelections(): boolean {
    return !this.isLoading && !(this.searchControl.value ?? '').trim() && !this.hasActiveFilters;
  }

  get canSaveCreatorSelections(): boolean {
    if (this.selectedMovies.length !== 15) return false;
    const unique = new Set<number>(this.selectedMovies.map((m) => m.id));
    return unique.size === 15;
  }

  get hasSavedCreatorSelections(): boolean {
    return this.usingSavedCreatorSelections;
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
    this.creatorViewMode = this.getCreatorViewMode();
    this.resultsViewMode = this.getResultsViewMode();
    this.initCreatorSelections();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        const trimmed = value?.trim() ?? '';
        if (trimmed.length >= 3 && /^[a-zA-Z0-9 ]*$/.test(trimmed)) {
          this.currentQuery = trimmed;
          this.currentPage = 1;
          this.search();
        } else {
          // If user saved their 15, keep them visible as the default grid whenever
          // the search input is empty/invalid.
          if (this.usingSavedCreatorSelections && this.creatorSelections.length === 15) {
            this.movies = this.creatorSelections;
            this.totalResults = this.creatorSelections.length;
            this.currentPage = 1;
          } else {
            this.movies = [];
            this.totalResults = 0;
            this.currentPage = 1;
          }

          this.currentQuery = '';
          this.cdr.markForCheck();
        }
      });
  }

  private initCreatorSelections(): void {
    const savedIds = this.getSavedCreatorSelectionIds();
    if (savedIds.length === 15) {
      this.usingSavedCreatorSelections = true;
      this.savedCreatorSelectionIds = savedIds;
      this.loadCreatorSelectionsByIds(savedIds, undefined, true);
      return;
    }

    // Default behavior: rank by how often movies appear across your collections,
    // then pad to 15. We still fetch full details from the API so posters are correct.
    this.usingSavedCreatorSelections = false;
    this.savedCreatorSelectionIds = null;

    const fallback = this.buildCreatorSelections();
    this.loadCreatorSelectionsByIds(
      fallback.map((m) => m.id),
      fallback,
      false
    );
  }

  private getSavedCreatorSelectionIds(): number[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.creatorSelectionsStorageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    } catch {
      return [];
    }
  }

  private saveCreatorSelectionIds(ids: number[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.creatorSelectionsStorageKey, JSON.stringify(ids));
  }

  private loadCreatorSelectionsByIds(
    ids: number[],
    fallbackMovies?: MovieWithFavoriteCount[],
    alsoSetAsDefaultMovies: boolean = false
  ): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const fallbackMap = new Map<number, MovieWithFavoriteCount>();
    if (fallbackMovies) {
      for (const m of fallbackMovies) fallbackMap.set(m.id, m);
    }

    forkJoin(
      ids.map((id) =>
        this.tmdbService.getMovieDetails(id).pipe(catchError(() => of<MovieDetails | null>(null)))
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailsArr) => {
          this.creatorSelections = detailsArr.map((details, idx) => {
            const id = ids[idx];
            if (details) return details as MovieWithFavoriteCount;

            return (
              fallbackMap.get(id) ?? {
                id,
                title: `Movie ${id}`,
                poster_path: '',
                vote_average: 0,
                overview: '',
                release_date: '',
              }
            );
          });

          if (alsoSetAsDefaultMovies) {
            // For the default view (movies-grid), we only need the base Movie fields;
            // `MovieWithFavoriteCount` is structurally compatible with `Movie`.
            this.movies = this.creatorSelections;
            this.totalResults = this.creatorSelections.length;
            this.currentPage = 1;
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.creatorSelections = (
            fallbackMovies?.slice(0, 15) ??
            (ids.map((id) => ({
              id,
              title: `Movie ${id}`,
              poster_path: '',
              vote_average: 0,
              overview: '',
              release_date: '',
            })) as MovieWithFavoriteCount[])
          ).slice(0, 15);

          if (alsoSetAsDefaultMovies) {
            this.movies = this.creatorSelections;
            this.totalResults = this.creatorSelections.length;
            this.currentPage = 1;
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
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

    const fallback: MovieWithFavoriteCount[] = [
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

    // "Always 15" behavior:
    // - use saved movies ranked by how many collections contain them
    // - then pad with fallback movies (cycled) to reach exactly 15 cards
    const base = fromStorage.length > 0 ? fromStorage.slice(0, 15) : [];
    const result: MovieWithFavoriteCount[] = [...base];

    let i = 0;
    while (result.length < 15) {
      result.push({ ...fallback[i % fallback.length] });
      i += 1;
    }

    return result.slice(0, 15);
  }

  search(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const hasGenres = this.activeFilters.genreIds.length > 0;
    const source$ =
      !this.currentQuery && this.hasActiveFilters
        ? this.tmdbService.discoverMovies(this.currentPage, this.activeFilters)
        : this.tmdbService.searchMovies(this.currentQuery, this.currentPage, this.activeFilters);

    source$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        // Client-side genre filter when using search API with genre selection
        const results =
          hasGenres && this.currentQuery
            ? response.results.filter(
                (m) =>
                  !m.genre_ids?.length ||
                  m.genre_ids.some((id) => this.activeFilters.genreIds.includes(id))
              )
            : response.results;

        this.movies = results;
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

  openFiltersDialog(): void {
    const ref = this.dialog.open(MovieFiltersDialog, {
      width: '520px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'filters-dialog-panel',
      data: { filters: { ...this.activeFilters, genreIds: [...this.activeFilters.genreIds] } },
    });

    ref.afterClosed().subscribe((filters: MovieFilters | undefined) => {
      if (!filters) return;
      this.activeFilters = filters;
      this.currentPage = 1;

      if (this.currentQuery || this.hasActiveFilters) {
        this.search();
      }
      this.cdr.markForCheck();
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
        autoFocus: false,
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
      this.selectedMovies = [...this.selectedMovies, movie];
    } else {
      this.selectedMovies = this.selectedMovies.filter((m) => m.id !== movie.id);
    }
    this.cdr.markForCheck();
  }

  isSelected(movieId: number): boolean {
    return this.selectedMovies.some((m) => m.id === movieId);
  }

  removeFromSelection(movie: Movie): void {
    this.selectedMovies = this.selectedMovies.filter((m) => m.id !== movie.id);
    this.cdr.markForCheck();
  }

  openAddToCollection(): void {
    const ref = this.dialog.open(AddToCollectionDialog, {
      width: '420px',
      maxWidth: '96vw',
      panelClass: 'add-to-collection-dialog-panel',
      data: { movies: this.selectedMovies },
    });

    ref.afterClosed().subscribe(() => {
      if (this.usingSavedCreatorSelections && this.savedCreatorSelectionIds?.length === 15) {
        this.loadCreatorSelectionsByIds(this.savedCreatorSelectionIds, undefined, true);
        return;
      }

      // If not using saved selections, we keep the original behavior:
      // rank by collection frequency and re-fill to 15.
      const fallback = this.buildCreatorSelections();
      this.loadCreatorSelectionsByIds(
        fallback.map((m) => m.id),
        fallback,
        false
      );
    });
  }

  saveCreatorSelections(): void {
    if (!this.canSaveCreatorSelections) return;

    const ids = Array.from(new Set(this.selectedMovies.map((m) => m.id)));
    if (ids.length !== 15) return;

    this.usingSavedCreatorSelections = true;
    this.savedCreatorSelectionIds = ids;
    this.saveCreatorSelectionIds(ids);

    // Clear the "Add to Collection" selection so you can immediately see
    // the updated Creator's Selections list.
    this.selectedMovies = [];
    this.loadCreatorSelectionsByIds(ids, undefined, true);
    this.cdr.markForCheck();
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

  clearAllResults(): void {
    this.clearSearch();
    this.activeFilters = { genreIds: [], yearMin: null, yearMax: null, language: '' };
    this.movies = [];
    this.totalResults = 0;
    this.currentPage = 1;
    this.currentQuery = '';
    this.cdr.markForCheck();
  }

  get filterSummary(): string {
    const parts: string[] = [];
    if (this.activeFilters.genreIds.length) parts.push(`${this.activeFilters.genreIds.length} genre(s)`);
    if (this.activeFilters.yearMin || this.activeFilters.yearMax) {
      const min = this.activeFilters.yearMin ?? '…';
      const max = this.activeFilters.yearMax ?? '…';
      parts.push(`${min}–${max}`);
    }
    if (this.activeFilters.language) parts.push(this.activeFilters.language.toUpperCase());
    return parts.join(', ');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setCreatorViewMode(mode: 'grid' | 'list'): void {
    this.creatorViewMode = mode;
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.creatorViewModeStorageKey, mode);
  }

  setResultsViewMode(mode: 'grid' | 'list'): void {
    this.resultsViewMode = mode;
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.resultsViewModeStorageKey, mode);
  }

  private getCreatorViewMode(): 'grid' | 'list' {
    if (!isPlatformBrowser(this.platformId)) return 'grid';
    const raw = localStorage.getItem(this.creatorViewModeStorageKey);
    return raw === 'list' ? 'list' : 'grid';
  }

  private getResultsViewMode(): 'grid' | 'list' {
    if (!isPlatformBrowser(this.platformId)) return 'grid';
    const raw = localStorage.getItem(this.resultsViewModeStorageKey);
    return raw === 'list' ? 'list' : 'grid';
  }
}
