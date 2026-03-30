import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CollectionsService } from './core/services/collections';
import { SelectionService } from './core/services/selection.service';
import { ToastComponent } from './core/components/toast/toast.component';
import { SelectionTrayComponent } from './features/search/selection-tray/selection-tray';
import { AddToCollectionDialog } from './features/collections/add-to-collection-dialog/add-to-collection-dialog';
import { Movie } from './core/models/movie.model';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, ToastComponent, SelectionTrayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private collectionsService = inject(CollectionsService);
  readonly selectionService = inject(SelectionService);
  private dialog = inject(MatDialog);

  readonly imageBaseUrl = environment.tmdbImageBaseUrl;
  menuOpen = signal(false);

  get collectionsCount(): number {
    return this.collectionsService.getCollections().length;
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  openAddToCollection(): void {
    const ref = this.dialog.open(AddToCollectionDialog, {
      width: '420px',
      maxWidth: '96vw',
      panelClass: 'add-to-collection-dialog-panel',
      data: { movies: this.selectionService.movies },
    });
    ref.afterClosed().subscribe((added: boolean | undefined) => {
      if (added) this.selectionService.clear();
    });
  }

  removeFromSelection(movie: Movie): void {
    this.selectionService.remove(movie);
  }
}
