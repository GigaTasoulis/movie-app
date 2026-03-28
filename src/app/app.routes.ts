import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Search | CineVault',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchComponent),
  },

  {
    path: 'movie/:id',
    title: 'Movie | CineVault',
    loadComponent: () =>
      import('./features/movie-details/movie-details').then((m) => m.MovieDetailsComponent),
  },

  {
    path: 'collections',
    title: 'Collections | CineVault',
    loadComponent: () =>
      import('./features/collections/collections').then((m) => m.CollectionsComponent),
  },
  {
    path: 'collections/create',
    title: 'New Collection | CineVault',
    loadComponent: () =>
      import('./features/collections/collection-create/collection-create').then(
        (m) => m.CollectionCreate
      ),
  },
  {
    path: 'collections/:id',
    title: 'Collection | CineVault',
    loadComponent: () =>
      import('./features/collections/collection-detail/collection-detail').then(
        (m) => m.CollectionDetail
      ),
  },
];
