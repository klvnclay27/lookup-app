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

export type SportsStanding = {
  team: string;
  short: string;
  wins: number;
  losses: number;
  pct: string;
};

export type SportsStory = {
  id: string;
  league: SportsLeague;
  headline: string;
  source: string;
  time: string;
  colors: [string, string];
};

export type SportsFavoriteTeam = SportsTeam & {
  record: string;
  next: string;
};

export type SportsOddsFormat = 'Spread' | 'Moneyline' | 'Total';
export type SportsOddsMovement = 'up' | 'down' | 'none';
export type SportsOddsTeamMeta = { record: string; streak: string; rank: string };

export type SportsOddsGame = {
  id: SportsGameId;
  league: SportsLeague;
  status: string;
  away: SportsTeam;
  home: SportsTeam;
  updated: string;
  odds: Record<SportsOddsFormat, {
    away: string;
    home: string;
    awayMovement: SportsOddsMovement;
    homeMovement: SportsOddsMovement;
  }>;
};

export type SportsSnapshot = {
  favoriteTeamIds: SportsTeamId[];
  favoriteTeams: SportsFavoriteTeam[];
  games: SportsGame[];
  odds: SportsOddsGame[];
  oddsTeamMeta: Record<string, SportsOddsTeamMeta>;
  standings: Partial<Record<SportsLeague, SportsStanding[]>>;
  stories: SportsStory[];
  teamRecords: Record<string, string>;
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

export const MOCK_SPORTS_FAVORITE_TEAMS: SportsFavoriteTeam[] = [
  { ...MOCK_SPORTS_TEAMS.knicks, record: '34–18', next: 'vs. Nets · Tomorrow' },
  { ...MOCK_SPORTS_TEAMS.nets, record: '22–31', next: '@ Heat · 8:00 PM' },
  { ...MOCK_SPORTS_TEAMS.giants, record: '9–8', next: 'vs. Cowboys · Sun' },
  { ...MOCK_SPORTS_TEAMS.yankees, record: '68–49', next: '@ Red Sox · Tonight' },
];

export const MOCK_SPORTS_TEAM_RECORDS: Record<string, string> = {
  'New York Knicks': '34–18', 'Boston Celtics': '42–12', 'Brooklyn Nets': '22–31', 'Miami Heat': '29–25',
  'New York Giants': '9–8', 'Dallas Cowboys': '9–8', 'New York Yankees': '68–49', 'Boston Red Sox': '62–55',
  'New York Rangers': '36–18', 'Boston Bruins': '34–19',
};

export const MOCK_SPORTS_STANDINGS: Partial<Record<SportsLeague, SportsStanding[]>> = {
  NBA: [
    { team: 'Boston Celtics', short: 'BOS', wins: 42, losses: 12, pct: '.778' },
    { team: 'New York Knicks', short: 'NYK', wins: 34, losses: 18, pct: '.654' },
    { team: 'Milwaukee Bucks', short: 'MIL', wins: 33, losses: 21, pct: '.611' },
    { team: 'Cleveland Cavaliers', short: 'CLE', wins: 32, losses: 22, pct: '.593' },
    { team: 'Miami Heat', short: 'MIA', wins: 29, losses: 25, pct: '.537' },
  ],
  NFL: [
    { team: 'Philadelphia Eagles', short: 'PHI', wins: 14, losses: 3, pct: '.824' },
    { team: 'Washington Commanders', short: 'WAS', wins: 12, losses: 5, pct: '.706' },
    { team: 'Dallas Cowboys', short: 'DAL', wins: 9, losses: 8, pct: '.529' },
    { team: 'New York Giants', short: 'NYG', wins: 9, losses: 8, pct: '.529' },
    { team: 'Chicago Bears', short: 'CHI', wins: 8, losses: 9, pct: '.471' },
  ],
  MLB: [
    { team: 'New York Yankees', short: 'NYY', wins: 68, losses: 49, pct: '.581' },
    { team: 'Baltimore Orioles', short: 'BAL', wins: 66, losses: 51, pct: '.564' },
    { team: 'Boston Red Sox', short: 'BOS', wins: 62, losses: 55, pct: '.530' },
    { team: 'Tampa Bay Rays', short: 'TB', wins: 58, losses: 59, pct: '.496' },
    { team: 'Toronto Blue Jays', short: 'TOR', wins: 55, losses: 62, pct: '.470' },
  ],
  NHL: [
    { team: 'New York Rangers', short: 'NYR', wins: 36, losses: 18, pct: '.667' },
    { team: 'Boston Bruins', short: 'BOS', wins: 34, losses: 19, pct: '.642' },
    { team: 'Florida Panthers', short: 'FLA', wins: 33, losses: 20, pct: '.623' },
    { team: 'Toronto Maple Leafs', short: 'TOR', wins: 31, losses: 22, pct: '.585' },
    { team: 'New Jersey Devils', short: 'NJD', wins: 29, losses: 24, pct: '.547' },
  ],
};

export const MOCK_SPORTS_STORIES: SportsStory[] = [
  { id: 'knicks-run', league: 'NBA', headline: 'Knicks find another gear during late fourth-quarter run', source: 'LookUP Sports', time: '18m ago', colors: ['#D86720', '#203E75'] },
  { id: 'yankees-rivalry', league: 'MLB', headline: 'Yankees–Red Sox rivalry delivers another instant classic', source: 'Diamond Daily', time: '42m ago', colors: ['#182C54', '#A72D36'] },
  { id: 'giants-camp', league: 'NFL', headline: 'Five standouts emerging from Giants training camp', source: 'Sunday Report', time: '1h ago', colors: ['#14377A', '#A91E32'] },
  { id: 'rangers-line', league: 'NHL', headline: 'Rangers reshape top line ahead of Boston matchup', source: 'Ice Level', time: '2h ago', colors: ['#0748A1', '#D22C36'] },
];

export const MOCK_SPORTS_ODDS: SportsOddsGame[] = [
  { id: 'odds-nyk-bkn', league: 'NBA', status: 'Tonight · 7:30 PM', away: MOCK_SPORTS_TEAMS.knicks, home: MOCK_SPORTS_TEAMS.nets, updated: 'Updated 4m ago', odds: { Spread: { away: 'Knicks -4.5', home: 'Nets +4.5', awayMovement: 'up', homeMovement: 'down' }, Moneyline: { away: 'Knicks -180', home: 'Nets +155', awayMovement: 'down', homeMovement: 'up' }, Total: { away: 'Over 221.5', home: 'Under 221.5', awayMovement: 'up', homeMovement: 'none' } } },
  { id: 'odds-bos-mia', league: 'NBA', status: 'Tomorrow · 8:00 PM', away: MOCK_SPORTS_TEAMS.celtics, home: MOCK_SPORTS_TEAMS.heat, updated: 'Updated 7m ago', odds: { Spread: { away: 'Celtics -6.0', home: 'Heat +6.0', awayMovement: 'none', homeMovement: 'up' }, Moneyline: { away: 'Celtics -225', home: 'Heat +190', awayMovement: 'up', homeMovement: 'down' }, Total: { away: 'Over 216.5', home: 'Under 216.5', awayMovement: 'down', homeMovement: 'up' } } },
  { id: 'odds-nyg-dal', league: 'NFL', status: 'Sunday · 4:25 PM', away: MOCK_SPORTS_TEAMS.giants, home: MOCK_SPORTS_TEAMS.cowboys, updated: 'Updated 11m ago', odds: { Spread: { away: 'Giants +3.5', home: 'Cowboys -3.5', awayMovement: 'up', homeMovement: 'down' }, Moneyline: { away: 'Giants +160', home: 'Cowboys -190', awayMovement: 'none', homeMovement: 'up' }, Total: { away: 'Over 44.5', home: 'Under 44.5', awayMovement: 'up', homeMovement: 'none' } } },
  { id: 'odds-nyy-bos', league: 'MLB', status: 'Tonight · 7:10 PM', away: MOCK_SPORTS_TEAMS.yankees, home: MOCK_SPORTS_TEAMS.redSox, updated: 'Updated 14m ago', odds: { Spread: { away: 'Yankees -1.5', home: 'Red Sox +1.5', awayMovement: 'down', homeMovement: 'up' }, Moneyline: { away: 'Yankees -135', home: 'Red Sox +120', awayMovement: 'up', homeMovement: 'none' }, Total: { away: 'Over 8.5', home: 'Under 8.5', awayMovement: 'none', homeMovement: 'down' } } },
];

export const MOCK_SPORTS_ODDS_TEAM_META: Record<string, SportsOddsTeamMeta> = {
  'New York Knicks': { record: '42–18', streak: 'W3', rank: '#2 East' }, 'Brooklyn Nets': { record: '28–32', streak: 'L1', rank: '#10 East' },
  'Boston Celtics': { record: '46–14', streak: 'W5', rank: '#1 East' }, 'Miami Heat': { record: '34–27', streak: 'W2', rank: '#6 East' },
  'New York Giants': { record: '9–8', streak: 'W1', rank: '#3 NFC East' }, 'Dallas Cowboys': { record: '12–5', streak: 'W2', rank: '#1 NFC East' },
  'New York Yankees': { record: '68–49', streak: 'W4', rank: '#1 AL East' }, 'Boston Red Sox': { record: '62–55', streak: 'L2', rank: '#3 AL East' },
};

export const mockSportsProvider: SportsDataProvider = {
  provenance: 'mock',
  async getGames() {
    return {
      favoriteTeamIds: [MOCK_SPORTS_TEAMS.knicks.id, MOCK_SPORTS_TEAMS.yankees.id],
      favoriteTeams: MOCK_SPORTS_FAVORITE_TEAMS,
      games: MOCK_SPORTS_GAMES,
      odds: MOCK_SPORTS_ODDS,
      oddsTeamMeta: MOCK_SPORTS_ODDS_TEAM_META,
      standings: MOCK_SPORTS_STANDINGS,
      stories: MOCK_SPORTS_STORIES,
      teamRecords: MOCK_SPORTS_TEAM_RECORDS,
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

function canUseSportsData(result: SportsDataResult, allowMock = false): result is Extract<SportsDataResult, { data: SportsSnapshot }> {
  return result.provenance === 'live' || (result.provenance === 'mock' && allowMock);
}

export function getStandings(result: SportsDataResult, league: SportsLeague, options: { allowMock?: boolean } = {}): SportsStanding[] {
  return canUseSportsData(result, options.allowMock) ? result.data.standings[league] ?? [] : [];
}

export function getSportsStories(result: SportsDataResult, options: { allowMock?: boolean } = {}): SportsStory[] {
  return canUseSportsData(result, options.allowMock) ? result.data.stories : [];
}

export function getSportsOdds(result: SportsDataResult, options: { allowMock?: boolean } = {}): SportsOddsGame[] {
  return canUseSportsData(result, options.allowMock) ? result.data.odds : [];
}

export const getSports = getGames;
