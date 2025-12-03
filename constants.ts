import { TournamentData } from './types';

export const MOCK_DATA: TournamentData = {
  grupos: {
    "A": ["Thunder FC", "Lightning Strikers", "River Plate Amador", "Old Boys"],
    "B": ["Vila Nova", "Real Matismo", "Inter de Bairro", "Juventude"],
    "C": ["Dynamo", "Spartan", "Titans", "Olympians"],
    "D": ["Raptors", "Wolves", "Eagles", "Sharks"]
  },
  jogos: [
    // Group A Matches
    { id: "1", chave: "A", time1: "Thunder FC", placar1: 2, time2: "Old Boys", placar2: 1, status: "played", date: "10/05 14:00" },
    { id: "2", chave: "A", time1: "Lightning Strikers", placar1: 1, time2: "River Plate Amador", placar2: 1, status: "played", date: "10/05 15:00" },
    { id: "3", chave: "A", time1: "Thunder FC", placar1: 3, time2: "River Plate Amador", placar2: 0, status: "played", date: "17/05 14:00" },
    { id: "4", chave: "A", time1: "Old Boys", placar1: 0, time2: "Lightning Strikers", placar2: 2, status: "played", date: "17/05 15:00" },
    { id: "5", chave: "A", time1: "Thunder FC", placar1: null, time2: "Lightning Strikers", placar2: null, status: "scheduled", date: "24/05 14:00" },
    
    // Group B Matches (Sample)
    { id: "6", chave: "B", time1: "Vila Nova", placar1: 4, time2: "Juventude", placar2: 2, status: "played", date: "10/05 16:00" },
    { id: "7", chave: "B", time1: "Real Matismo", placar1: 1, time2: "Inter de Bairro", placar2: 3, status: "played", date: "10/05 17:00" },

    // More scheduled
    { id: "8", chave: "C", time1: "Dynamo", placar1: null, time2: "Spartan", placar2: null, status: "scheduled", date: "24/05 16:00" }
  ],
  classificacao: {
    "A": [
      // Name, Played, Points, Wins, Draws, Losses, GF, GA, GD
      ["Thunder FC", 2, 6, 2, 0, 0, 5, 1, 4],
      ["Lightning Strikers", 2, 4, 1, 1, 0, 3, 1, 2],
      ["River Plate Amador", 2, 1, 0, 1, 1, 1, 4, -3],
      ["Old Boys", 2, 0, 0, 0, 2, 1, 4, -3]
    ],
    "B": [
      ["Vila Nova", 1, 3, 1, 0, 0, 4, 2, 2],
      ["Inter de Bairro", 1, 3, 1, 0, 0, 3, 1, 2],
      ["Real Matismo", 1, 0, 0, 0, 1, 1, 3, -2],
      ["Juventude", 1, 0, 0, 0, 1, 2, 4, -2]
    ],
    "C": [
       ["Dynamo", 0, 0, 0, 0, 0, 0, 0, 0],
       ["Spartan", 0, 0, 0, 0, 0, 0, 0, 0],
       ["Titans", 0, 0, 0, 0, 0, 0, 0, 0],
       ["Olympians", 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    "D": [
       ["Raptors", 0, 0, 0, 0, 0, 0, 0, 0],
       ["Wolves", 0, 0, 0, 0, 0, 0, 0, 0],
       ["Eagles", 0, 0, 0, 0, 0, 0, 0, 0],
       ["Sharks", 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  },
  mata_mata: {
    quartas: [
      { id: "q1", round: "quartas", time1: "Thunder FC", placar1: 2, time2: "Vila Nova", placar2: 1, winner: "Thunder FC" },
      { id: "q2", round: "quartas", time1: "Inter de Bairro", placar1: 1, time2: "Lightning Strikers", placar2: 0, winner: "Inter de Bairro" },
      { id: "q3", round: "quartas", time1: "Dynamo", placar1: 3, time2: "Raptors", placar2: 2, winner: "Dynamo" },
      { id: "q4", round: "quartas", time1: "Wolves", placar1: 1, time2: "Spartan", placar2: 2, winner: "Spartan" }
    ],
    semis: [
      { id: "s1", round: "semis", time1: "Thunder FC", placar1: 1, time2: "Inter de Bairro", placar2: 0, winner: "Thunder FC" },
      { id: "s2", round: "semis", time1: "Dynamo", placar1: 2, time2: "Spartan", placar2: 2, winner: "Spartan" } // Penaltis ficticios
    ],
    final: [
      { id: "f1", round: "final", time1: "Thunder FC", placar1: null, time2: "Spartan", placar2: null }
    ],
    terceiro_lugar: [
      { id: "t1", round: "terceiro_lugar", time1: "Inter de Bairro", placar1: null, time2: "Dynamo", placar2: null }
    ]
  },
  ranking_final: {
    first: "TBD",
    second: "TBD",
    third: "TBD",
    fourth: "TBD"
  }
};