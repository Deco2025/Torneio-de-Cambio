
export interface Match {
  id: string;
  chave: string;
  time1: string;
  placar1: number | null | '';
  time2: string;
  placar2: number | null | '';
  status: 'played' | 'scheduled' | 'live';
  date?: string;
  location?: string;
}

// [Team, Played, Points, Wins, Draws, Losses, GF, GA, GD]
// Added "Losses" explicitly to the tuple for clarity, total 9 elements now
export type StandingRow = [string, number, number, number, number, number, number, number, number];

export interface GroupStandings {
  [key: string]: StandingRow[];
}

export interface KnockoutMatch {
  id: string;
  round: 'quartas' | 'semis' | 'final' | 'terceiro_lugar';
  time1: string;
  placar1: number | null | '';
  time2: string;
  placar2: number | null | '';
  winner?: string;
}

export interface KnockoutStage {
  quartas: KnockoutMatch[];
  semis: KnockoutMatch[];
  final: KnockoutMatch[];
  terceiro_lugar: KnockoutMatch[];
}

export interface FinalRanking {
  first: string;
  second: string;
  third: string;
  fourth: string;
}

export interface TournamentData {
  grupos: {
    [key: string]: string[];
  };
  jogos: Match[];
  classificacao: GroupStandings;
  mata_mata: KnockoutStage;
  ranking_final?: FinalRanking;
}
