import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CollectionsService } from '../../../core/services/collections';
import { MovieDetailsDialogComponent } from '../../movie-details/movie-details-dialog/movie-details-dialog';
import { Collection } from '../../../core/models/movie.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-collection-detail',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './collection-detail.html',
  styleUrl: './collection-detail.scss',
})
export class CollectionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dialog = inject(MatDialog);
  private collectionsService = inject(CollectionsService);

  collection: Collection | undefined;
  imageBaseUrl = environment.tmdbImageBaseUrl;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.collection = this.collectionsService.getCollectionById(id);
    if (!this.collection) this.router.navigate(['/collections']);
  }

  removeMovie(movieId: number): void {
    this.collectionsService.removeMovieFromCollection(this.collection!.id, movieId);
    this.collection = this.collectionsService.getCollectionById(this.collection!.id);
  }

  openMovieDetails(movieId: number): void {
    this.location.go(`/movie/${movieId}`);
    const movie = this.collection!.movies.find((m) => m.id === movieId);
    const dialogRef = this.dialog.open(MovieDetailsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { movie },
    });
    dialogRef.afterClosed().subscribe(() => {
      this.location.go(`/collections/${this.collection!.id}`);
    });
  }

  goBack(): void {
    this.router.navigate(['/collections']);
  }
}
