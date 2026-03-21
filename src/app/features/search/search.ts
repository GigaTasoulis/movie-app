import { Component, inject, OnDestroy } from '@angular/core';
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
  ],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class SearchComponent implements OnDestroy {
  private tmdbService = inject(TmdbApiService);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  movies: Movie[] = [];
  totalResults = 0;
  currentPage = 1;
  pageSize = 20;
  isLoading = false;
  currentQuery = '';
  imageBaseUrl = environment.tmdbImageBaseUrl;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value && value.length >= 3 && /^[a-zA-Z0-9 ]*$/.test(value)) {
          this.currentQuery = value;
          this.currentPage = 1;
          this.search();
        } else {
          this.movies = [];
          this.totalResults = 0;
        }
      });
  }

  search(): void {
    this.isLoading = true;
    this.tmdbService
      .searchMovies(this.currentQuery, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.movies = response.results;
          this.totalResults = response.total_results;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.search();
  }

  getErrorMessage(): string | null {
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
