import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TmdbApiService } from '../../../core/services/tmdb-api.service';
import { Genre, MovieFilters } from '../../../core/models/movie.model';

@Component({
  selector: 'app-movie-filters-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movie-filters-dialog.html',
  styleUrl: './movie-filters-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieFiltersDialog implements OnInit {
  private tmdbService = inject(TmdbApiService);
  private dialogRef = inject(MatDialogRef<MovieFiltersDialog>);
  private cdr = inject(ChangeDetectorRef);
  data: { filters: MovieFilters } = inject(MAT_DIALOG_DATA);

  genres: Genre[] = [];
  selectedGenreIds = new Set<number>();

  readonly yearAbsMin = 1900;
  readonly yearAbsMax = new Date().getFullYear();
  selectedYearMin = this.yearAbsMin;
  selectedYearMax = this.yearAbsMax;
  selectedLanguage = '';

  readonly languages = [
    { code: '', label: 'Any' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese' },
  ];

  ngOnInit(): void {
    if (this.data?.filters) {
      this.selectedGenreIds = new Set(this.data.filters.genreIds);
      this.selectedYearMin = this.data.filters.yearMin ?? this.yearAbsMin;
      this.selectedYearMax = this.data.filters.yearMax ?? this.yearAbsMax;
      this.selectedLanguage = this.data.filters.language ?? '';
    }

    this.tmdbService.getGenres().subscribe((res) => {
      this.genres = res.genres;
      this.cdr.markForCheck();
    });
  }

  toggleGenre(id: number): void {
    if (this.selectedGenreIds.has(id)) {
      this.selectedGenreIds.delete(id);
    } else {
      this.selectedGenreIds.add(id);
    }
    this.selectedGenreIds = new Set(this.selectedGenreIds);
  }

  isGenreSelected(id: number): boolean {
    return this.selectedGenreIds.has(id);
  }

  get progressLeft(): string {
    return `${((this.selectedYearMin - this.yearAbsMin) / (this.yearAbsMax - this.yearAbsMin)) * 100}%`;
  }

  get progressRight(): string {
    return `${((this.yearAbsMax - this.selectedYearMax) / (this.yearAbsMax - this.yearAbsMin)) * 100}%`;
  }

  onMinChange(value: number): void {
    this.selectedYearMin = Math.min(+value, this.selectedYearMax - 1);
  }

  onMaxChange(value: number): void {
    this.selectedYearMax = Math.max(+value, this.selectedYearMin + 1);
  }

  clearAll(): void {
    this.selectedGenreIds = new Set();
    this.selectedYearMin = this.yearAbsMin;
    this.selectedYearMax = this.yearAbsMax;
    this.selectedLanguage = '';
  }

  save(): void {
    const filters: MovieFilters = {
      genreIds: Array.from(this.selectedGenreIds),
      yearMin: this.selectedYearMin !== this.yearAbsMin ? this.selectedYearMin : null,
      yearMax: this.selectedYearMax !== this.yearAbsMax ? this.selectedYearMax : null,
      language: this.selectedLanguage,
    };
    this.dialogRef.close(filters);
  }

  close(): void {
    this.dialogRef.close();
  }
}
