export type SportKind = 'basketball' | 'football' | 'baseball' | 'hockey';
export type GameCenterStatus = 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'INTERMISSION' | 'FINAL';
export type GameCastEventType = 'made-shot' | 'missed-shot' | 'three-pointer' | 'free-throw' | 'foul' | 'turnover' | 'steal' | 'block' | 'rebound' | 'substitution' | 'timeout' | 'period-end' | 'update';

export type GameCenterTeam = {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  record: string;
  recentForm: string;
};

export type PlayerGameStats = {
  min?: string;
  pts?: number;
  reb?: number;
  ast?: number;
  pf?: number;
  fg?: string;
  threePt?: string;
  ft?: string;
  stl?: number;
  blk?: number;
  turnovers?: number;
  values?: Record<string, string | number>;
};

export type GameCenterPlayer = {
  id: string;
  name: string;
  teamId: string;
  position: string;
  jerseyNumber: string;
  starter: boolean;
  gameStats: PlayerGameStats;
  seasonStats?: Record<string, string | number>;
};

export type GameCastEvent = {
  id: string;
  type: GameCastEventType;
  period: string;
  clock: string;
  teamId?: string;
  playerId?: string;
  description: string;
  awayScore?: number;
  homeScore?: number;
};

export type BoxScoreColumn = { key: string; label: string; emphasis?: boolean };
export type MatchupComparison = { label: string; away: string; home: string };

export type SportsGameDetails = {
  id: string;
  sport: SportKind;
  league: string;
  status: GameCenterStatus;
  statusLabel: string;
  period?: string;
  clock?: string;
  scheduledTime?: string;
  venue: string;
  broadcast: string;
  awayTeam: GameCenterTeam;
  homeTeam: GameCenterTeam;
  awayScore?: number;
  homeScore?: number;
  players: GameCenterPlayer[];
  gameCast: GameCastEvent[];
  boxScoreColumns: BoxScoreColumn[];
  matchup: {
    summary: string;
    headToHead: string;
    comparisons: MatchupComparison[];
  };
};

const TEAMS = {
  knicks: { id: 'team-nyk', name: 'New York Knicks', abbreviation: 'NYK', color: '#F58426', record: '42–18', recentForm: 'W3' },
  celtics: { id: 'team-bos-nba', name: 'Boston Celtics', abbreviation: 'BOS', color: '#007A33', record: '46–14', recentForm: 'W5' },
  nets: { id: 'team-bkn', name: 'Brooklyn Nets', abbreviation: 'BKN', color: '#545B66', record: '28–32', recentForm: 'L1' },
  heat: { id: 'team-mia', name: 'Miami Heat', abbreviation: 'MIA', color: '#98002E', record: '34–27', recentForm: 'W2' },
  giants: { id: 'team-nyg', name: 'New York Giants', abbreviation: 'NYG', color: '#0B2265', record: '9–8', recentForm: 'W1' },
  cowboys: { id: 'team-dal', name: 'Dallas Cowboys', abbreviation: 'DAL', color: '#58728E', record: '12–5', recentForm: 'W2' },
  yankees: { id: 'team-nyy', name: 'New York Yankees', abbreviation: 'NYY', color: '#132448', record: '68–49', recentForm: 'W4' },
  redSox: { id: 'team-bos-mlb', name: 'Boston Red Sox', abbreviation: 'BOS', color: '#BD3039', record: '62–55', recentForm: 'L2' },
  rangers: { id: 'team-nyr', name: 'New York Rangers', abbreviation: 'NYR', color: '#0038A8', record: '36–18', recentForm: 'W2' },
  bruins: { id: 'team-bos-nhl', name: 'Boston Bruins', abbreviation: 'BOS', color: '#B88A00', record: '34–19', recentForm: 'W1' },
} satisfies Record<string, GameCenterTeam>;

const basketballColumns: BoxScoreColumn[] = [
  { key: 'min', label: 'MIN' }, { key: 'pts', label: 'PTS', emphasis: true }, { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' }, { key: 'pf', label: 'PF', emphasis: true }, { key: 'fg', label: 'FG' },
  { key: 'threePt', label: '3PT' }, { key: 'ft', label: 'FT' }, { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' }, { key: 'turnovers', label: 'TO' },
];

const player = (id: string, name: string, teamId: string, position: string, jerseyNumber: string, stats: PlayerGameStats, starter = true): GameCenterPlayer => ({
  id, name, teamId, position, jerseyNumber, starter, gameStats: stats,
  seasonStats: stats.pts === undefined ? undefined : { PPG: Math.max(8, stats.pts - 2), RPG: stats.reb ?? 0, APG: stats.ast ?? 0 },
});

const knicksPlayers = [
  player('player-jalen-brunson', 'Jalen Brunson', TEAMS.knicks.id, 'PG', '11', { min: '35', pts: 31, reb: 4, ast: 8, pf: 2, fg: '11-20', threePt: '4-8', ft: '5-6', stl: 1, blk: 0, turnovers: 3 }),
  player('player-mikal-bridges', 'Mikal Bridges', TEAMS.knicks.id, 'SF', '25', { min: '34', pts: 22, reb: 5, ast: 3, pf: 4, fg: '8-15', threePt: '3-7', ft: '3-4', stl: 2, blk: 1, turnovers: 1 }),
  player('player-og-anunoby', 'OG Anunoby', TEAMS.knicks.id, 'PF', '8', { min: '31', pts: 17, reb: 7, ast: 2, pf: 5, fg: '7-12', threePt: '2-5', ft: '1-2', stl: 1, blk: 2, turnovers: 2 }),
  player('player-josh-hart', 'Josh Hart', TEAMS.knicks.id, 'SG', '3', { min: '33', pts: 13, reb: 10, ast: 6, pf: 3, fg: '5-9', threePt: '1-3', ft: '2-2', stl: 1, blk: 0, turnovers: 2 }),
  player('player-mitchell-robinson', 'Mitchell Robinson', TEAMS.knicks.id, 'C', '23', { min: '24', pts: 8, reb: 9, ast: 1, pf: 4, fg: '4-5', threePt: '0-0', ft: '0-2', stl: 0, blk: 2, turnovers: 1 }),
];

const celticsPlayers = [
  player('player-jayson-tatum', 'Jayson Tatum', TEAMS.celtics.id, 'SF', '0', { min: '37', pts: 29, reb: 9, ast: 5, pf: 3, fg: '10-21', threePt: '4-10', ft: '5-6', stl: 1, blk: 1, turnovers: 2 }),
  player('player-jaylen-brown', 'Jaylen Brown', TEAMS.celtics.id, 'SG', '7', { min: '35', pts: 25, reb: 6, ast: 4, pf: 5, fg: '9-18', threePt: '3-7', ft: '4-5', stl: 2, blk: 0, turnovers: 3 }),
  player('player-derrick-white', 'Derrick White', TEAMS.celtics.id, 'PG', '9', { min: '32', pts: 16, reb: 3, ast: 7, pf: 2, fg: '6-12', threePt: '3-8', ft: '1-1', stl: 1, blk: 1, turnovers: 1 }),
  player('player-jrue-holiday', 'Jrue Holiday', TEAMS.celtics.id, 'PG', '4', { min: '30', pts: 12, reb: 5, ast: 5, pf: 4, fg: '5-10', threePt: '2-5', ft: '0-0', stl: 2, blk: 0, turnovers: 1 }),
  player('player-kristaps-porzingis', 'Kristaps Porzingis', TEAMS.celtics.id, 'C', '8', { min: '27', pts: 20, reb: 8, ast: 2, pf: 6, fg: '7-13', threePt: '2-5', ft: '4-4', stl: 0, blk: 3, turnovers: 2 }),
];

const basketballGame = (overrides: Partial<SportsGameDetails> & Pick<SportsGameDetails, 'id' | 'awayTeam' | 'homeTeam'>): SportsGameDetails => ({
  sport: 'basketball', league: 'NBA', status: 'SCHEDULED', statusLabel: 'Scheduled', scheduledTime: '8:00 PM', venue: 'Arena', broadcast: 'Local TV',
  players: [], gameCast: [], boxScoreColumns: basketballColumns,
  matchup: { summary: 'Two conference opponents meet in a locally simulated matchup.', headToHead: 'Season series tied 1–1', comparisons: [{ label: 'Points / game', away: '113.4', home: '115.1' }, { label: 'Rebounds / game', away: '44.2', home: '45.0' }, { label: 'Last 10', away: '7–3', home: '8–2' }] },
  ...overrides,
});

const GAME_DETAILS: Record<string, SportsGameDetails> = {
  'nyk-bos': basketballGame({
    id: 'nyk-bos', awayTeam: TEAMS.knicks, homeTeam: TEAMS.celtics, status: 'LIVE', statusLabel: 'Live', period: '4TH', clock: '6:42', venue: 'TD Garden', broadcast: 'ESPN', awayScore: 98, homeScore: 102,
    players: [...knicksPlayers, ...celticsPlayers],
    gameCast: [
      { id: 'play-8', type: 'timeout', period: '4TH', clock: '6:42', teamId: TEAMS.knicks.id, description: 'Knicks take a full timeout.', awayScore: 98, homeScore: 102 },
      { id: 'play-7', type: 'three-pointer', period: '4TH', clock: '6:51', teamId: TEAMS.celtics.id, playerId: 'player-jayson-tatum', description: 'Jayson Tatum makes a 26-foot three-pointer.', awayScore: 98, homeScore: 102 },
      { id: 'play-6', type: 'turnover', period: '4TH', clock: '7:09', teamId: TEAMS.knicks.id, playerId: 'player-jalen-brunson', description: 'Jalen Brunson loses the ball; Derrick White records the steal.', awayScore: 98, homeScore: 99 },
      { id: 'play-5', type: 'made-shot', period: '4TH', clock: '7:31', teamId: TEAMS.knicks.id, playerId: 'player-og-anunoby', description: 'OG Anunoby makes a driving layup.', awayScore: 98, homeScore: 99 },
      { id: 'play-4', type: 'foul', period: '4TH', clock: '7:48', teamId: TEAMS.celtics.id, playerId: 'player-jaylen-brown', description: 'Jaylen Brown is called for a shooting foul.', awayScore: 96, homeScore: 99 },
      { id: 'play-3', type: 'free-throw', period: '4TH', clock: '8:02', teamId: TEAMS.knicks.id, playerId: 'player-jalen-brunson', description: 'Jalen Brunson makes both free throws.', awayScore: 96, homeScore: 99 },
      { id: 'play-2', type: 'block', period: '4TH', clock: '8:27', teamId: TEAMS.knicks.id, playerId: 'player-og-anunoby', description: 'OG Anunoby blocks Jayson Tatum at the rim.', awayScore: 94, homeScore: 99 },
      { id: 'play-1', type: 'period-end', period: '3RD', clock: '0:00', description: 'End of the third quarter.', awayScore: 88, homeScore: 91 },
    ],
    matchup: { summary: 'Boston protects home court while New York tries to close a late fourth-quarter gap.', headToHead: 'Boston leads season series 2–1', comparisons: [{ label: 'Points / game', away: '116.8', home: '119.2' }, { label: 'Defensive rating', away: '111.4', home: '109.8' }, { label: 'Last 10', away: '7–3', home: '9–1' }, { label: 'Home / away', away: '19–11 away', home: '26–4 home' }] },
  }),
  'bkn-mia': basketballGame({ id: 'bkn-mia', awayTeam: TEAMS.nets, homeTeam: TEAMS.heat, venue: 'Kaseya Center', broadcast: 'YES', scheduledTime: '8:00 PM' }),
  'odds-nyk-bkn': basketballGame({ id: 'odds-nyk-bkn', awayTeam: TEAMS.knicks, homeTeam: TEAMS.nets, venue: 'Barclays Center', broadcast: 'MSG / YES', scheduledTime: '7:30 PM', players: knicksPlayers }),
  'odds-bos-mia': basketballGame({ id: 'odds-bos-mia', awayTeam: TEAMS.celtics, homeTeam: TEAMS.heat, venue: 'Kaseya Center', broadcast: 'NBA TV', scheduledTime: '8:00 PM', players: celticsPlayers }),
  'nyg-dal': {
    id: 'nyg-dal', sport: 'football', league: 'NFL', status: 'FINAL', statusLabel: 'Final', period: 'FINAL', venue: 'MetLife Stadium', broadcast: 'FOX', awayTeam: TEAMS.giants, homeTeam: TEAMS.cowboys, awayScore: 24, homeScore: 21,
    players: [player('player-nyg-qb', 'Daniel Jones', TEAMS.giants.id, 'QB', '8', { values: { CMP: '24/33', YDS: 268, TD: 2, INT: 1 } }), player('player-dal-qb', 'Dak Prescott', TEAMS.cowboys.id, 'QB', '4', { values: { CMP: '21/32', YDS: 244, TD: 2, INT: 1 } })],
    gameCast: [{ id: 'nfl-2', type: 'period-end', period: '4TH', clock: '0:00', description: 'Game ends.', awayScore: 24, homeScore: 21 }, { id: 'nfl-1', type: 'update', period: '4TH', clock: '1:12', teamId: TEAMS.giants.id, description: 'New York converts a late field goal.', awayScore: 24, homeScore: 21 }],
    boxScoreColumns: [{ key: 'CMP', label: 'CMP' }, { key: 'YDS', label: 'YDS', emphasis: true }, { key: 'TD', label: 'TD' }, { key: 'INT', label: 'INT' }],
    matchup: { summary: 'New York wins a close divisional matchup.', headToHead: 'Dallas leads recent series 6–4', comparisons: [{ label: 'Total yards', away: '381', home: '354' }, { label: 'Turnovers', away: '1', home: '2' }, { label: 'Time of possession', away: '31:42', home: '28:18' }] },
  },
  'nyy-bos': {
    id: 'nyy-bos', sport: 'baseball', league: 'MLB', status: 'LIVE', statusLabel: 'Live', period: 'BOT 7', clock: '1 OUT', venue: 'Fenway Park', broadcast: 'MLB TV', awayTeam: TEAMS.yankees, homeTeam: TEAMS.redSox, awayScore: 4, homeScore: 3,
    players: [player('player-nyy-batter', 'Aaron Judge', TEAMS.yankees.id, 'RF', '99', { values: { AB: 4, H: 2, RBI: 2, HR: 1 } }), player('player-bos-batter', 'Rafael Devers', TEAMS.redSox.id, '3B', '11', { values: { AB: 3, H: 1, RBI: 1, HR: 0 } })],
    gameCast: [{ id: 'mlb-2', type: 'update', period: 'BOT 7', clock: '1 OUT', teamId: TEAMS.redSox.id, description: 'Rafael Devers singles to right field.', awayScore: 4, homeScore: 3 }, { id: 'mlb-1', type: 'update', period: 'TOP 7', clock: '2 OUT', teamId: TEAMS.yankees.id, description: 'Aaron Judge drives in a run with a double.', awayScore: 4, homeScore: 2 }],
    boxScoreColumns: [{ key: 'AB', label: 'AB' }, { key: 'H', label: 'H', emphasis: true }, { key: 'RBI', label: 'RBI' }, { key: 'HR', label: 'HR' }],
    matchup: { summary: 'The rivalry remains close entering the late innings.', headToHead: 'New York leads season series 7–5', comparisons: [{ label: 'Team hits', away: '8', home: '7' }, { label: 'Errors', away: '0', home: '1' }, { label: 'Runners left', away: '6', home: '5' }] },
  },
  'nyr-bos': {
    id: 'nyr-bos', sport: 'hockey', league: 'NHL', status: 'SCHEDULED', statusLabel: 'Scheduled', scheduledTime: '7:30 PM', venue: 'Madison Square Garden', broadcast: 'TNT', awayTeam: TEAMS.rangers, homeTeam: TEAMS.bruins,
    players: [player('player-nyr-wing', 'Artemi Panarin', TEAMS.rangers.id, 'LW', '10', { values: { G: 0, A: 0, SOG: 0, PIM: 0 } }), player('player-bos-wing', 'David Pastrnak', TEAMS.bruins.id, 'RW', '88', { values: { G: 0, A: 0, SOG: 0, PIM: 0 } })], gameCast: [],
    boxScoreColumns: [{ key: 'G', label: 'G', emphasis: true }, { key: 'A', label: 'A' }, { key: 'SOG', label: 'SOG' }, { key: 'PIM', label: 'PIM' }],
    matchup: { summary: 'Two Original Six contenders meet at Madison Square Garden.', headToHead: 'Season series tied 1–1', comparisons: [{ label: 'Goals / game', away: '3.42', home: '3.18' }, { label: 'Power play', away: '24.1%', home: '22.8%' }, { label: 'Last 10', away: '7–3', home: '6–4' }] },
  },
};

const ALIASES: Record<string, string> = { 'odds-nyg-dal': 'nyg-dal', 'odds-nyy-bos': 'nyy-bos' };

export async function getGameDetails(gameId: string): Promise<SportsGameDetails | undefined> {
  const resolvedId = ALIASES[gameId] ?? gameId;
  return GAME_DETAILS[resolvedId];
}
