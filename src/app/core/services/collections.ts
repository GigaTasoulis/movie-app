import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Collection } from '../models/movie.model';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  private platformId = inject(PLATFORM_ID);
  private storageKey = 'movie_collections';

  private getStorage(): Collection[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveStorage(collections: Collection[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.storageKey, JSON.stringify(collections));
  }

  getCollections(): Collection[] {
    return this.getStorage();
  }

  getCollectionById(id: string): Collection | undefined {
    return this.getStorage().find((c) => c.id === id);
  }

  createCollection(title: string, description: string): Collection {
    const collections = this.getStorage();
    const newCollection: Collection = {
      id: crypto.randomUUID(),
      title,
      description,
      movies: [],
      createdAt: new Date().toISOString(),
    };
    collections.push(newCollection);
    this.saveStorage(collections);
    return newCollection;
  }

  addMoviesToCollection(collectionId: string, movies: Movie[]): void {
    const collections = this.getStorage();
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    movies.forEach((movie) => {
      if (!collection.movies.find((m) => m.id === movie.id)) {
        collection.movies.push(movie);
      }
    });
    this.saveStorage(collections);
  }

  removeMovieFromCollection(collectionId: string, movieId: number): void {
    const collections = this.getStorage();
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;
    collection.movies = collection.movies.filter((m) => m.id !== movieId);
    this.saveStorage(collections);
  }

  deleteCollection(id: string): void {
    const collections = this.getStorage().filter((c) => c.id !== id);
    this.saveStorage(collections);
  }
}
