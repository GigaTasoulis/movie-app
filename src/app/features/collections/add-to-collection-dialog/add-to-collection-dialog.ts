import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CollectionsService } from '../../../core/services/collections';
import { Collection, Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-add-to-collection-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule, MatIconModule],
  templateUrl: './add-to-collection-dialog.html',
  styleUrl: './add-to-collection-dialog.scss',
})
export class AddToCollectionDialog implements OnInit {
  private collectionsService = inject(CollectionsService);
  private dialogRef = inject(MatDialogRef<AddToCollectionDialog>);
  data = inject(MAT_DIALOG_DATA) as { movies: Movie[] };

  collections: Collection[] = [];

  ngOnInit(): void {
    this.collections = this.collectionsService.getCollections();
  }

  addToCollection(collectionId: string): void {
    this.collectionsService.addMoviesToCollection(collectionId, this.data.movies);
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close();
  }
}
