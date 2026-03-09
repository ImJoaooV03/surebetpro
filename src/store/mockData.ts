// src/store/mockData.ts
// Dados simulados gerados pelo nosso motor de arbitragem para alimentar o Frontend SaaS

export const mockSurebets = [
  {
    id: 'sb-1',
    sport: 'Futebol',
    league: 'Premier League',
    event: 'Arsenal vs Liverpool',
    market: 'Mais/Menos 2.5 Gols',
    startTime: new Date(Date.now() + 3600000).toISOString(), // Daqui 1 hora
    roi: 4.25,
    legs: [
      { bookmaker: 'Superbet', selection: 'Mais 2.5', odd: 2.10, stakePct: 48.78 },
      { bookmaker: 'Novibet', selection: 'Menos 2.5', odd: 2.05, stakePct: 51.22 }
    ]
  },
  {
    id: 'sb-2',
    sport: 'Basquete',
    league: 'NBA',
    event: 'Lakers vs Warriors',
    market: 'Vencedor da Partida (Moneyline)',
    startTime: new Date(Date.now() + 7200000).toISOString(),
    roi: 2.15,
    legs: [
      { bookmaker: 'Novibet', selection: 'Lakers', odd: 1.85, stakePct: 55.20 },
      { bookmaker: 'Superbet', selection: 'Warriors', odd: 2.28, stakePct: 44.80 }
    ]
  },
  {
    id: 'sb-3',
    sport: 'Tênis',
    league: 'ATP Roland Garros',
    event: 'Alcaraz vs Djokovic',
    market: 'Vencedor do 1º Set',
    startTime: new Date(Date.now() + 18000000).toISOString(),
    roi: 5.80,
    legs: [
      { bookmaker: 'Superbet', selection: 'Alcaraz', odd: 1.95, stakePct: 53.85 },
      { bookmaker: 'Novibet', selection: 'Djokovic', odd: 2.30, stakePct: 46.15 }
    ]
  },
  {
    id: 'sb-4',
    sport: 'Futebol',
    league: 'Brasileirão Série B',
    event: 'Santos vs Novorizontino',
    market: 'Ambas Marcam',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    roi: 1.85,
    legs: [
      { bookmaker: 'Novibet', selection: 'Sim', odd: 2.00, stakePct: 50.00 },
      { bookmaker: 'Superbet', selection: 'Não', odd: 2.04, stakePct: 50.00 }
    ]
  }
];
