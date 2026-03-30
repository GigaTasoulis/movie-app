import { Injectable } from '@angular/core';
import { Movie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private _movies: Movie[] = [];

  get movies(): Movie[] {
    return this._movies;
  }

  toggle(movie: Movie): void {
    const index = this._movies.findIndex((m) => m.id === movie.id);
    if (index === -1) {
      this._movies = [...this._movies, movie];
    } else {
      this._movies = this._movies.filter((m) => m.id !== movie.id);
    }
  }

  remove(movie: Movie): void {
    this._movies = this._movies.filter((m) => m.id !== movie.id);
  }

  isSelected(movieId: number): boolean {
    return this._movies.some((m) => m.id === movieId);
  }

  clear(): void {
    this._movies = [];
  }
}
