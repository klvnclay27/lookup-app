export type SportsDataProvenance = 'live' | 'mock' | 'unavailable';
export type SportsLeague = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'Soccer';
export type SportsGameStatus = 'LIVE' | 'FINAL' | 'UPCOMING';

export type SportsGameId = string;
export type SportsTeamId = string;
export type SportsPlayerId = string;

export type SportsTeam = {
  id: SportsTeamId;
  name: string;
  short: string;
  colors: [string, string];
};

export type SportsGame = {
  id: SportsGameId;
  league: SportsLeague;
  status: SportsGameStatus;
  detail: string;
  home: SportsTeam;
  away: SportsTeam;
  homeScore?: number;
  awayScore?: number;
  network: string;
  venue: string;
};

export type SportsSnapshot = {
  favoriteTeamIds: SportsTeamId[];
  games: SportsGame[];
  updatedAt: string;
};

export type SportsIntelligenceSummary = {
  favoriteTeams?: string[];
  games?: string[];
};

export type SportsDataResult =
  | { data: SportsSnapshot; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export interface SportsDataProvider {
  readonly provenance: 'live' | 'mock';
  getGames(): Promise<SportsSnapshot>;
}

export const MOCK_SPORTS_TEAMS = {
  knicks: { id: 'team-nyk', name: 'New York Knicks', short: 'NYK', colors: ['#F58426', '#1D428A'] } satisfies SportsTeam,
  celtics: { id: 'team-bos-nba', name: 'Boston Celtics', short: 'BOS', colors: ['#007A33', '#BA9653'] } satisfies SportsTeam,
  nets: { id: 'team-bkn', name: 'Brooklyn Nets', short: 'BKN', colors: ['#111111', '#777777'] } satisfies SportsTeam,
  heat: { id: 'team-mia', name: 'Miami Heat', short: 'MIA', colors: ['#98002E', '#F9A01B'] } satisfies SportsTeam,
  giants: { id: 'team-nyg', name: 'New York Giants', short: 'NYG', colors: ['#0B2265', '#A71930'] } satisfies SportsTeam,
  cowboys: { id: 'team-dal', name: 'Dallas Cowboys', short: 'DAL', colors: ['#041E42', '#869397'] } satisfies SportsTeam,
  yankees: { id: 'team-nyy', name: 'New York Yankees', short: 'NYY', colors: ['#132448', '#C4CED4'] } satisfies SportsTeam,
  redSox: { id: 'team-bos-mlb', name: 'Boston Red Sox', short: 'BOS', colors: ['#BD3039', '#0C2340'] } satisfies SportsTeam,
  rangers: { id: 'team-nyr', name: 'New York Rangers', short: 'NYR', colors: ['#0038A8', '#CE1126'] } satisfies SportsTeam,
  bruins: { id: 'team-bos-nhl', name: 'Boston Bruins', short: 'BOS', colors: ['#111111', '#FFB81C'] } satisfies SportsTeam,
};

export const MOCK_SPORTS_GAMES: SportsGame[] = [
  { id: 'nyk-bos', league: 'NBA', status: 'LIVE', detail: 'Q4 · 6:42', away: MOCK_SPORTS_TEAMS.knicks, home: MOCK_SPORTS_TEAMS.celtics, awayScore: 98, homeScore: 102, network: 'ESPN', venue: 'TD Garden' },
  { id: 'bkn-mia', league: 'NBA', status: 'UPCOMING', detail: '8:00 PM', away: MOCK_SPORTS_TEAMS.nets, home: MOCK_SPORTS_TEAMS.heat, network: 'YES', venue: 'Kaseya Center' },
  { id: 'nyg-dal', league: 'NFL', status: 'FINAL', detail: 'Final', away: MOCK_SPORTS_TEAMS.giants, home: MOCK_SPORTS_TEAMS.cowboys, awayScore: 24, homeScore: 21, network: 'FOX', venue: 'MetLife Stadium' },
  { id: 'nyy-bos', league: 'MLB', status: 'LIVE', detail: 'Bot 7th', away: MOCK_SPORTS_TEAMS.yankees, home: MOCK_SPORTS_TEAMS.redSox, awayScore: 4, homeScore: 3, network: 'MLB TV', venue: 'Fenway Park' },
  { id: 'nyr-bos', league: 'NHL', status: 'UPCOMING', detail: '7:30 PM', away: MOCK_SPORTS_TEAMS.rangers, home: MOCK_SPORTS_TEAMS.bruins, network: 'TNT', venue: 'Madison Square Garden' },
];

export const mockSportsProvider: SportsDataProvider = {
  provenance: 'mock',
  async getGames() {
    return {
      favoriteTeamIds: [MOCK_SPORTS_TEAMS.knicks.id, MOCK_SPORTS_TEAMS.yankees.id],
      games: MOCK_SPORTS_GAMES,
      updatedAt: new Date().toISOString(),
    };
  },
};

export async function getGames(provider: SportsDataProvider = mockSportsProvider): Promise<SportsDataResult> {
  try {
    const data = await provider.getGames();
    return { data, error: null, provenance: provider.provenance };
  } catch {
    return { data: null, error: 'Sports information is currently unavailable.', provenance: 'unavailable' };
  }
}

export function getSportsSummary(
  result: SportsDataResult,
  options: { allowMock?: boolean } = {},
): SportsIntelligenceSummary | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;

  const teams = new Map<string, SportsTeam>();
  result.data.games.forEach((game) => {
    teams.set(game.away.id, game.away);
    teams.set(game.home.id, game.home);
  });

  return {
    favoriteTeams: result.data.favoriteTeamIds.map((id) => teams.get(id)?.name).filter((name): name is string => Boolean(name)),
    games: result.data.games
      .filter((game) => game.status === 'UPCOMING')
      .map((game) => `${game.away.name} vs ${game.home.name} ${game.detail}`),
  };
}

export const getSports = getGames;
