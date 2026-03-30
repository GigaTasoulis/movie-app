import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionsService } from '../../../core/services/collections';
import { Collection, Movie } from '../../../core/models/movie.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-add-to-collection-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './add-to-collection-dialog.html',
  styleUrl: './add-to-collection-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToCollectionDialog implements OnInit {
  private collectionsService = inject(CollectionsService);
  private dialogRef = inject(MatDialogRef<AddToCollectionDialog>);
  private toastService = inject(ToastService);
  data = inject(MAT_DIALOG_DATA) as { movies: Movie[] };

  collections: Collection[] = [];

  ngOnInit(): void {
    this.collections = this.collectionsService.getCollections();
  }

  addToCollection(collectionId: string): void {
    const collection = this.collections.find((c) => c.id === collectionId);
    const { added, skipped } = this.collectionsService.addMoviesToCollection(collectionId, this.data.movies);
    const name = collection?.title ?? 'collection';

    if (added > 0 && skipped === 0) {
      this.toastService.show(
        `${added} ${added === 1 ? 'movie' : 'movies'} added to "${name}"`,
        'success'
      );
    } else if (added > 0 && skipped > 0) {
      this.toastService.show(
        `${added} added, ${skipped} already in "${name}"`,
        'warning'
      );
    } else {
      this.toastService.show(
        `All movies are already in "${name}"`,
        'info'
      );
    }

    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close();
  }
}
