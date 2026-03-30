import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CollectionsService } from '../../../core/services/collections';
import { ToastService } from '../../../core/services/toast.service';
import { MovieDetailsDialogComponent } from '../../movie-details/movie-details-dialog/movie-details-dialog';
import { Collection } from '../../../core/models/movie.model';
import { environment } from '../../../../environments/environment';
import { TmdbApiService } from '../../../core/services/tmdb-api.service';

@Component({
  selector: 'app-collection-detail',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './collection-detail.html',
  styleUrl: './collection-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private collectionsService = inject(CollectionsService);
  private tmdbService = inject(TmdbApiService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  collection: Collection | undefined;
  imageBaseUrl = environment.tmdbImageBaseUrl;
  imagesLoading = false;
  private pendingImages = 0;

  get skeletonItems(): number[] {
    return Array.from({ length: this.collection?.movies?.length || 6 }, (_, i) => i);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.collection = this.collectionsService.getCollectionById(id);
    if (!this.collection) {
      this.router.navigate(['/collections']);
      return;
    }
    const count = this.collection.movies?.length ?? 0;
    if (count > 0) {
      this.pendingImages = count;
      this.imagesLoading = true;
    }
  }

  onMovieImageLoad(): void {
    if (!this.imagesLoading) return;
    this.pendingImages = Math.max(0, this.pendingImages - 1);
    if (this.pendingImages === 0) {
      this.imagesLoading = false;
      this.cdr.markForCheck();
    }
  }

  removeMovie(movieId: number): void {
    const movie = this.collection!.movies.find((m) => m.id === movieId);
    this.collectionsService.removeMovieFromCollection(this.collection!.id, movieId);
    this.collection = this.collectionsService.getCollectionById(this.collection!.id);
    this.toastService.show(`"${movie?.title ?? 'Movie'}" removed from collection`, 'info');
  }

  openMovieDetails(movieId: number): void {
    this.tmdbService.getMovieDetails(movieId).subscribe((movie) => {
      this.location.go(`/movie/${movieId}`);
      const dialogRef = this.dialog.open(MovieDetailsDialogComponent, {
        width: '1020px',
        maxHeight: '95vh',
        autoFocus: false,
        data: { movie },
      });
      dialogRef.afterClosed().subscribe(() => {
        this.location.go(`/collections/${this.collection!.id}`);
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/collections']);
  }
}
