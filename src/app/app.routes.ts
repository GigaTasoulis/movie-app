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

  {
    path: 'collections',
    loadComponent: () =>
      import('./features/collections/collections').then((m) => m.Collections),
  },
  {
    path: 'collections/create',
    loadComponent: () =>
      import('./features/collections/collection-create/collection-create').then(
        (m) => m.CollectionCreate
      ),
  },
  {
    path: 'collections/:id',
    loadComponent: () =>
      import('./features/collections/collection-detail/collection-detail').then(
        (m) => m.CollectionDetail
      ),
  },
];
