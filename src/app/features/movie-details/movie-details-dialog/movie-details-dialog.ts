import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { TmdbApiService } from '../../../core/services/tmdb-api.service';
import { MovieDetails } from '../../../core/models/movie.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-movie-details-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, FormsModule],
  templateUrl: './movie-details-dialog.html',
  styleUrl: './movie-details-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieDetailsDialogComponent implements OnInit {
  private tmdbService = inject(TmdbApiService);
  private dialogRef = inject(MatDialogRef<MovieDetailsDialogComponent>);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  data = inject(MAT_DIALOG_DATA) as { movie: MovieDetails };

  imageBaseUrl = environment.tmdbImageBaseUrl;
  rating = 5;
  isRating = false;
  imageLoaded = false;

  ngOnInit(): void {
    if (!this.data.movie.poster_path || !isPlatformBrowser(this.platformId)) {
      this.imageLoaded = true;
    } else {
      const img = new Image();
      const done = () => {
        this.imageLoaded = true;
        this.cdr.detectChanges();
      };
      img.onload = done;
      img.onerror = done;
      img.src = this.imageBaseUrl + this.data.movie.poster_path;
    }

    this.tmdbService.createGuestSession().subscribe({
      next: (session) => {
        this.guestSessionId = session.guest_session_id;
      },
      error: () => {
        this.guestSessionId = null;
      },
    });
  }

  get ratingPercent(): string {
    return (((this.rating - 0.5) / 9.5) * 100).toFixed(1) + '%';
  }

  formatMoney(value: number): string {
    if (!value) return 'N/A';
    if (value >= 1_000_000_000)
      return `$${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  }
  ratingSuccess = false;
  guestSessionId: string | null = null;

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
        this.cdr.detectChanges();
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
