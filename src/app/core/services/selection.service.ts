import { Injectable, signal, computed } from '@angular/core';
import { Movie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly _movies = signal<Movie[]>([]);

  readonly movies = this._movies.asReadonly();
  readonly count = computed(() => this._movies().length);

  toggle(movie: Movie): void {
    this._movies.update((list) => {
      const exists = list.some((m) => m.id === movie.id);
      return exists ? list.filter((m) => m.id !== movie.id) : [...list, movie];
    });
  }

  remove(movie: Movie): void {
    this._movies.update((list) => list.filter((m) => m.id !== movie.id));
  }

  isSelected(movieId: number): boolean {
    return this._movies().some((m) => m.id === movieId);
  }

  clear(): void {
    this._movies.set([]);
  }
}
