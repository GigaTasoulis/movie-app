import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchComponent),
  },

  {
    path: 'movie/:id',
    loadComponent: () =>
      import('./features/movie-details/movie-details').then((m) => m.MovieDetailsComponent),
  },
];
