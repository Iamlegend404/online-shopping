export type TmdbDetailsResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime: number;
  rating: number;
  status: string;
  country: string | null;
  original_language: string;
  genres: Genre[];
  imdb_id: string | null;
  seasons: SeasonsType[];
  poster_path: string;
  backdrop_paths: string[];
  logo_paths: string[];
  cache: boolean;
};

export type SeasonsType = {
  season_number: number;
  name: string;
  episode_count: number;
};

export type Genre = {
  id: number;
  name: string;
};
