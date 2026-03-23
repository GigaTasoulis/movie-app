# CineVault

A movie discovery and collection management app built with Angular 21 and the TMDB API.

## Features

- **Search** — debounced movie search with paginated results
- **Movie Details** — budget, revenue, vote average, languages and more in a modal dialog
- **Rate Movies** — submit a personal rating (0.5–10) via TMDB guest sessions
- **Collections** — create named collections, add movies from search results, and manage them
- **Theming** — light / dark / system theme toggle, persisted in `localStorage`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Angular 21 (standalone components) |
| UI | Angular Material (MDC-based) |
| Styling | SCSS with CSS custom properties |
| State | Services + `localStorage` (no external store) |
| API | TMDB REST API v3 |
| Tests | Vitest (`ng test`) |

---

## Project Structure

```
src/app/
├── core/
│   ├── models/         # TypeScript interfaces (Movie, MovieDetails, Collection, …)
│   ├── services/
│   │   ├── tmdb-api.service.ts   # All TMDB HTTP calls
│   │   └── collections.ts        # Collections CRUD, backed by localStorage
│   └── directives/
│       └── search-input.ts       # Debounce directive for the search field
└── features/
    ├── search/                   # Search page + paginator
    ├── movie-details/
    │   └── movie-details-dialog/ # Movie detail modal
    └── collections/
        ├── collections/          # Collections list
        ├── collection-detail/    # Single collection view
        ├── collection-create/    # Create form
        └── add-to-collection-dialog/
```

### Architecture notes

- **Standalone components** — every component declares its own `imports`, no `NgModule` anywhere.
- **Dependency injection** — services are `providedIn: 'root'` and injected with `inject()`.
- **No client-side state library** — `CollectionsService` reads/writes directly to `localStorage` and is the single source of truth for collections. Movie data is always fetched fresh from TMDB.
- **TMDB guest sessions** — ratings use a temporary guest session created on dialog open. Sessions expire after their TTL and are not persisted.
- **Theming** — a single `body.light-mode` CSS class is toggled by `AppComponent`. All colours are CSS custom properties defined on `:root` (dark) and overridden on `body.light-mode`.

---

## Getting Started

```bash
npm install
ng serve
```

App runs at `http://localhost:4200`.

## Environment

Set your TMDB API key in `src/environments/environment.ts`:

```ts
export const environment = {
  tmdbApiKey: 'YOUR_API_KEY',
  tmdbBaseUrl: 'https://api.themoviedb.org/3',
  tmdbImageBaseUrl: 'https://image.tmdb.org/t/p/w500',
};
```

## Build

```bash
ng build   # output lands in dist/
ng test    # run unit tests with Vitest
```
