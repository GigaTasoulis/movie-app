export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface MovieDetails extends Movie {
  budget: number;
  revenue: number;
  vote_count: number;
  spoken_languages: SpokenLanguage[];
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface MovieSearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface GuestSession {
  success: boolean;
  guest_session_id: string;
  expires_at: string;
}

export interface RatingResponse {
  success: boolean;
  status_code: number;
  status_message: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  movies: Movie[];
  createdAt: string;
}
