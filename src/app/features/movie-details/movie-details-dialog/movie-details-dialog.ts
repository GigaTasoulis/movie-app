import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { TmdbApiService } from '../../../core/services/tmdb-api.service';
import { MovieDetails } from '../../../core/models/movie.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-movie-details-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './movie-details-dialog.html',
  styleUrl: './movie-details-dialog.scss',
})
export class MovieDetailsDialogComponent implements OnInit {
  private tmdbService = inject(TmdbApiService);
  private dialogRef = inject(MatDialogRef<MovieDetailsDialogComponent>);
  private cdr = inject(ChangeDetectorRef);
  data = inject(MAT_DIALOG_DATA) as { movie: MovieDetails };

  imageBaseUrl = environment.tmdbImageBaseUrl;
  rating = 5;
  isRating = false;

  get ratingPercent(): string {
    return ((this.rating - 0.5) / 9.5 * 100).toFixed(1) + '%';
  }

  formatMoney(value: number): string {
    if (!value) return 'N/A';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  }
  ratingSuccess = false;
  guestSessionId: string | null = null;

  ngOnInit(): void {
    this.tmdbService.createGuestSession().subscribe((session) => {
      this.guestSessionId = session.guest_session_id;
    });
  }

  submitRating(): void {
    if (!this.guestSessionId) return;
    this.isRating = true;
    this.tmdbService.rateMovie(this.data.movie.id, this.rating, this.guestSessionId).subscribe({
      next: () => {
        this.isRating = false;
        this.ratingSuccess = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRating = false;
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
