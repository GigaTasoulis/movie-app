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

## Creator's Selections Logic

The **Creator's Selections** section shows 15 movies on the search page when no query or filters are active. What you see depends on your state:

**Priority 1 — Saved selections (manual curation)**
If you have manually picked exactly 15 movies and saved them, those IDs are persisted in `localStorage`. On every load, those exact 15 movies are fetched from TMDB and displayed.

**Priority 2 — Collection frequency ranking (automatic)**
If no saved selections exist, the app scans all your collections and counts how many collections each movie appears in. Movies are ranked by that frequency (most-collected first) and fill the top slots.

**Priority 3 — Hardcoded fallback padding**
If you have fewer than 15 unique movies across your collections (or no collections at all), the remaining slots are filled with a curated list of well-known films (Inception, The Dark Knight, The Matrix, etc.), deduplicated against what is already in the list.

| State | What you see |
|---|---|
| No collections, no saved selections | All 15 hardcoded films |
| Some collections, no saved selections | Your most-collected movies first, padded by hardcoded films |
| 15 movies manually saved | Exactly those 15, always |

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

---

## Security

### 1. Content Security Policy (CSP)

A `Content-Security-Policy` meta tag is set in `src/index.html`. It restricts what the browser is allowed to load, reducing the attack surface for XSS and data injection.

| Directive | Allowed origins | Reason |
|---|---|---|
| `default-src` | `'self'` | Catch-all fallback |
| `script-src` | `'self'` | No inline scripts, no CDN scripts |
| `style-src` | `'self'` `'unsafe-inline'` Google Fonts Fontshare | Angular Material requires inline styles; fonts load external CSS |
| `font-src` | `'self'` `fonts.gstatic.com` `api.fontshare.com` `cdn.fontshare.com` | Covers all origins that serve font files |
| `img-src` | `'self'` `image.tmdb.org` `data:` `blob:` | TMDB poster images; data/blob for fallback SVGs |
| `connect-src` | `'self'` `api.themoviedb.org` | XHR/fetch calls to TMDB only |
| `object-src` | `'none'` | Blocks Flash and plugin embeds |
| `frame-ancestors` | `'none'` | Prevents the app from being embedded in an iframe (clickjacking protection) |

> **Note:** HTTP headers are stronger than meta tags for CSP (they support more directives and cannot be overridden by injected HTML). If this app is ever deployed behind a server you control, migrate this policy to the `Content-Security-Policy` response header and remove the meta tag.

---

### 2. HTTP Security Headers (helmet)

The Express SSR server uses [`helmet`](https://helmetjs.github.io/) to set security-related HTTP response headers on every request.

Headers set automatically by helmet:

| Header | Value | Effect |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection |
| `Strict-Transport-Security` | `max-age=15552000` | Enforces HTTPS on repeat visits |
| `Referrer-Policy` | `no-referrer` | Stops the URL leaking to third-party requests |
| `X-DNS-Prefetch-Control` | `off` | Disables cross-origin DNS prefetching |
| `X-Download-Options` | `noopen` | Prevents IE from auto-opening downloads |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Adobe Flash/PDF cross-domain requests |
| `X-XSS-Protection` | `0` | Disabled intentionally — modern browsers handle this natively and the old IE implementation introduced vulnerabilities |

`contentSecurityPolicy` and `crossOriginEmbedderPolicy` are disabled in helmet config because CSP is handled via the meta tag above, and COEP would block TMDB image loading.

---

### 3. Environment Files and API Key Safety

`src/environments/environment.ts` and `src/environments/environment.development.ts` are listed in `.gitignore` and have never been committed to the repository. The real TMDB API key therefore never appears in git history.

A committed template is provided at `src/environments/environment.example.ts`. To set up the project locally:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.development.ts
# then replace YOUR_TMDB_API_KEY with your real key in both files
```

---

### 4. Dependency Vulnerabilities (npm audit)

Package overrides are declared in `package.json` to force patched versions of sub-dependencies that cannot be updated via normal `npm audit fix` without a full Angular build toolchain upgrade:

```json
"overrides": {
  "brace-expansion": "^5.0.5",
  "path-to-regexp": "^8.4.0",
  "picomatch": "^4.0.4",
  "undici": "^7.23.1"
}
```

All four are **devDependency** vulnerabilities (Angular CLI / build tools). None of them are included in the production bundle or run on the server. Running `npm audit` on this repo should report **0 vulnerabilities**.
