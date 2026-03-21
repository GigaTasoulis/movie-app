import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionsService } from '../../core/services/collections';
import { Collection } from '../../core/models/movie.model';

@Component({
  selector: 'app-collections',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './collections.html',
  styleUrl: './collections.scss',
})
export class CollectionsComponent implements OnInit {
  private collectionsService = inject(CollectionsService);
  private router = inject(Router);

  collections: Collection[] = [];

  ngOnInit(): void {
    this.collections = this.collectionsService.getCollections();
  }

  goToCreate(): void {
    this.router.navigate(['/collections/create']);
  }

  goToCollection(id: string): void {
    this.router.navigate(['/collections', id]);
  }

  deleteCollection(event: Event, id: string): void {
    event.stopPropagation();
    this.collectionsService.deleteCollection(id);
    this.collections = this.collectionsService.getCollections();
  }
}
