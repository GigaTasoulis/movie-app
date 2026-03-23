import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TmdbApiService } from '../../core/services/tmdb-api.service';
import { MovieDetailsDialogComponent } from './movie-details-dialog/movie-details-dialog';

@Component({
  selector: 'app-movie-details',
  template: '',
})
export class MovieDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private tmdbService = inject(TmdbApiService);

  ngOnInit(): void {
    const movieId = Number(this.route.snapshot.paramMap.get('id'));

    this.tmdbService.getMovieDetails(movieId).subscribe((movie) => {
      const dialogRef = this.dialog.open(MovieDetailsDialogComponent, {
        width: '900px',
        maxHeight: '95vh',
        data: { movie },
      });

      dialogRef.afterClosed().subscribe(() => {
        this.router.navigate(['/']);
      });
    });
  }
}
