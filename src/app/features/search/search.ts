import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { TmdbApiService } from '../../core/services/tmdb-api.service';
import { Movie } from '../../core/models/movie.model';
import { SearchInputDirective } from '../../core/directives/search-input';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movie-details/movie-details-dialog/movie-details-dialog';
import { AddToCollectionDialog } from '../collections/add-to-collection-dialog/add-to-collection-dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-search',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SearchInputDirective,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
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
  selectedMovies: Movie[] = [];

  searchControl = new FormControl('', { updateOn: 'change' });
  movies: Movie[] = [];
  totalResults = 0;
  currentPage = 1;
  pageSize = 20;
  isLoading = false;
  currentQuery = '';
  imageBaseUrl = environment.tmdbImageBaseUrl;

  ngOnInit(): void {
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
    this.dialog.open(AddToCollectionDialog, {
      width: '500px',
      data: { movies: this.selectedMovies },
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
