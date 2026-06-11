export type Participant = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
};