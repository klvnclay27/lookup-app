import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isTabletWidth, pageHorizontalPadding } from '@/constants/layout';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import {
  getGames,
  MOCK_SPORTS_GAMES,
  MOCK_SPORTS_FAVORITE_TEAMS,
  MOCK_SPORTS_ODDS,
  MOCK_SPORTS_ODDS_TEAM_META,
  MOCK_SPORTS_STANDINGS,
  MOCK_SPORTS_STORIES,
  MOCK_SPORTS_TEAM_RECORDS,
  type SportsDataProvenance,
  type SportsGame,
  type SportsGameId,
  type SportsLeague,
  type SportsOddsFormat,
  type SportsOddsGame,
  type SportsOddsMovement,
  type SportsStanding,
  type SportsStory,
  type SportsTeam,
} from '@/services/sports';

type League = 'All' | SportsLeague;
type OddsFormat = SportsOddsFormat;
type OddsMovement = SportsOddsMovement;
type Story = SportsStory;
type Standing = SportsStanding;
type OddsGame = SportsOddsGame;

const LEAGUES: League[] = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];

const FAVORITE_TEAMS = MOCK_SPORTS_FAVORITE_TEAMS;
const TEAM_RECORDS = MOCK_SPORTS_TEAM_RECORDS;
const STANDINGS = MOCK_SPORTS_STANDINGS;
const STORIES = MOCK_SPORTS_STORIES;
const ODDS_GAMES = MOCK_SPORTS_ODDS;
const ODDS_TEAM_META = MOCK_SPORTS_ODDS_TEAM_META;

export default function SportsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isTabletWidth(width);
  const [selectedLeague, setSelectedLeague] = useState<League>('All');
  const [favorites, setFavorites] = useState<string[]>(['NYK', 'NYY']);
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('Spread');
  const [selectedOddsGame, setSelectedOddsGame] = useState<string | null>(null);
  const [favoriteOddsGames, setFavoriteOddsGames] = useState<string[]>([]);
  const [games, setGames] = useState<SportsGame[]>(MOCK_SPORTS_GAMES);
  const [favoriteTeams, setFavoriteTeams] = useState(FAVORITE_TEAMS);
  const [teamRecords, setTeamRecords] = useState(TEAM_RECORDS);
  const [standingsByLeague, setStandingsByLeague] = useState(STANDINGS);
  const [sportsStories, setSportsStories] = useState(STORIES);
  const [oddsGames, setOddsGames] = useState(ODDS_GAMES);
  const [oddsTeamMeta, setOddsTeamMeta] = useState(ODDS_TEAM_META);
  const [sportsProvenance, setSportsProvenance] = useState<SportsDataProvenance>('unavailable');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSports = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getGames();
    setSportsProvenance(result.provenance);
    if (result.provenance === 'unavailable') setError(result.error);
    else {
      setGames(result.data.games);
      setFavoriteTeams(result.data.favoriteTeams);
      setTeamRecords(result.data.teamRecords);
      setStandingsByLeague(result.data.standings);
      setSportsStories(result.data.stories);
      setOddsGames(result.data.odds);
      setOddsTeamMeta(result.data.oddsTeamMeta);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadSports();
  }, []);

  const filteredGames = useMemo(
    () => selectedLeague === 'All' ? games : games.filter((game) => game.league === selectedLeague),
    [games, selectedLeague],
  );
  const filteredStories = useMemo(
    () => selectedLeague === 'All' ? sportsStories : sportsStories.filter((story) => story.league === selectedLeague),
    [selectedLeague, sportsStories],
  );
  const standingsLeague = selectedLeague === 'All' || selectedLeague === 'Soccer' ? 'NBA' : selectedLeague;
  const standings = standingsByLeague[standingsLeague] ?? [];
  const featuredGame = filteredGames.find((game) => game.status === 'LIVE') ?? filteredGames[0] ?? games[0];
  const sortedOddsGames = useMemo(
    () => [...oddsGames].sort((a, b) => Number(favoriteOddsGames.includes(b.id)) - Number(favoriteOddsGames.includes(a.id))),
    [favoriteOddsGames, oddsGames],
  );

  const openGameById = (gameId: SportsGameId) => router.push({
    pathname: '/game-details',
    params: { gameId },
  });

  const openGame = (game: SportsGame) => openGameById(game.id);
  const toggleFavorite = (short: string) => {
    setFavorites((current) => current.includes(short) ? current.filter((team) => team !== short) : [...current, short]);
  };

  if (isLoading) {
    return <ScreenState title="Loading today’s action" copy="Bringing the scoreboard up to speed…" loading />;
  }

  if (error) {
    return <ScreenState title="Sports are unavailable" copy={error} actionLabel="Try again" onAction={() => { void loadSports(); }} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: pageHorizontalPadding(width), paddingBottom: insets.bottom + 140 },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR SPORTS HUB</Text>
          <Text style={styles.title}>Sports</Text>
          <Text style={styles.subtitle}>Every game. One place.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <Text style={styles.profileText}>LU</Text>
          </Pressable>
          <Pressable accessibilityLabel="Sports notifications" onPress={() => Alert.alert('Notifications', 'Sports alerts are coming soon.')} style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
            <Text style={styles.bellIcon}>●</Text>
          </Pressable>
        </View>
      </View>

      <ScoreTicker games={games} />
      {sportsProvenance === 'mock' ? <Text style={styles.simulatedDataLabel}>SIMULATED SPORTS DATA</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
        {LEAGUES.map((league) => {
          const active = league === selectedLeague;
          return (
            <Pressable key={league} onPress={() => setSelectedLeague(league)} style={({ pressed }) => [styles.leaguePill, active && styles.leaguePillActive, pressed && styles.pressed]}>
              <Text style={[styles.leagueText, active && styles.leagueTextActive]}>{league}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FeaturedGame game={featuredGame} isDesktop={isDesktop} onOpen={() => openGame(featuredGame)} teamRecords={teamRecords} />

      <View style={styles.section}>
        <SectionHeader title="Today’s Games" />
        {filteredGames.length === 0 ? (
          <EmptyLeague league={selectedLeague} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
            {filteredGames.map((game) => <GameCard key={game.id} game={game} onPress={() => openGame(game)} />)}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Favorite Teams" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
          {favoriteTeams.map((team) => (
            <FavoriteTeamCard key={team.name} team={team} favorite={favorites.includes(team.short)} onToggle={() => toggleFavorite(team.short)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.oddsHeader}>
          <View style={styles.oddsTitleGroup}>
            <Text style={styles.sectionTitle}>Game Odds</Text>
            <View style={styles.simulatedBadge}><Text style={styles.simulatedText}>SIMULATED</Text></View>
          </View>
          <Pressable onPress={() => Alert.alert('Game Odds', 'The full simulated odds view is coming soon.')} hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.oddsSelector}>
          {(['Spread', 'Moneyline', 'Total'] as OddsFormat[]).map((format) => (
            <OddsFormatPill key={format} active={oddsFormat === format} format={format} onPress={() => setOddsFormat(format)} />
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oddsCards}>
          {sortedOddsGames.map((game) => (
            <OddsCard
              favorite={favoriteOddsGames.includes(game.id)}
              key={game.id}
              format={oddsFormat}
              game={game}
              selected={selectedOddsGame === game.id}
              onPress={() => {
                setSelectedOddsGame(game.id);
                setTimeout(() => openGameById(game.id), 160);
              }}
              onToggleFavorite={() => setFavoriteOddsGames((current) => current.includes(game.id) ? current.filter((id) => id !== game.id) : [...current, game.id])}
              teamMeta={oddsTeamMeta}
            />
          ))}
        </ScrollView>
        <View style={styles.oddsInfoCard}>
          <Text style={styles.oddsInfoIcon}>i</Text>
          <Text style={styles.oddsNote}>Odds shown are simulated for MVP demonstration purposes only.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={`${standingsLeague} Standings`} />
        <StandingsTable standings={standings} />
      </View>

      <View style={styles.sectionLast}>
        <SectionHeader title="Top Stories" />
        {filteredStories.length === 0 ? (
          <EmptyLeague league={selectedLeague} stories />
        ) : (
          <View style={styles.storiesCard}>
            {filteredStories.map((story, index) => (
              <View key={story.id}>
                <StoryRow story={story} />
                {index < filteredStories.length - 1 && <View style={styles.storyDivider} />}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function TeamLogo({ team, size = 44 }: { team: SportsTeam; size?: number }) {
  return (
    <View style={[styles.teamLogo, { width: size, height: size, borderRadius: size / 2, backgroundColor: team.colors[0], borderColor: team.colors[1] }]}>
      <Text style={[styles.teamLogoText, { fontSize: size * 0.25 }]}>{team.short}</Text>
    </View>
  );
}

function ScoreTicker({ games }: { games: SportsGame[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ticker} contentContainerStyle={styles.tickerContent}>
      {games.map((game) => (
        <View key={game.id} style={styles.tickerItem}>
          <View style={styles.tickerTop}>
            <Text style={[styles.tickerStatus, game.status === 'LIVE' && styles.liveText]}>{game.status}</Text>
            <Text style={styles.tickerDetail}>{game.detail}</Text>
          </View>
          <Text style={styles.tickerTeams}>{game.away.short} <Text style={styles.tickerScore}>{game.awayScore ?? '–'}</Text>  ·  {game.home.short} <Text style={styles.tickerScore}>{game.homeScore ?? '–'}</Text></Text>
        </View>
      ))}
    </ScrollView>
  );
}

function FeaturedGame({ game, isDesktop, onOpen, teamRecords }: { game: SportsGame; isDesktop: boolean; onOpen: () => void; teamRecords: Record<string, string> }) {
  const logoSize = isDesktop ? 76 : 64;
  return (
    <View style={styles.featuredCard}>
      <View style={[styles.featuredGlow, { backgroundColor: game.away.colors[0] }]} />
      <View style={styles.featuredTop}>
        <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveBadgeText}>{game.status}</Text></View>
        <Text style={styles.featuredLeague}>{game.league} · {game.network}</Text>
      </View>
      <View style={styles.matchup}>
        <View style={[styles.featuredTeam, { width: isDesktop ? 180 : 88 }]}>
          <TeamLogo team={game.away} size={logoSize} />
          <Text numberOfLines={1} style={styles.featuredTeamName}>{game.away.name}</Text>
          <Text style={styles.teamRecord}>{teamRecords[game.away.name] ?? '—'}</Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={[styles.featuredScore, !isDesktop && styles.featuredScoreMobile]}>{game.awayScore ?? '–'} <Text style={styles.scoreDash}>—</Text> {game.homeScore ?? '–'}</Text>
          <Text style={styles.gameClock}>{game.detail}</Text>
        </View>
        <View style={[styles.featuredTeam, { width: isDesktop ? 180 : 88 }]}>
          <TeamLogo team={game.home} size={logoSize} />
          <Text numberOfLines={1} style={styles.featuredTeamName}>{game.home.name}</Text>
          <Text style={styles.teamRecord}>{teamRecords[game.home.name] ?? '—'}</Text>
        </View>
      </View>
      <View style={styles.featuredFooter}>
        <View><Text style={styles.venueLabel}>VENUE</Text><Text style={styles.venueText}>{game.venue}</Text></View>
        <Pressable onPress={onOpen} style={({ pressed }) => [styles.viewGameButton, pressed && styles.pressed]}><Text style={styles.viewGameText}>View Game</Text></Pressable>
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={() => Alert.alert(title, 'The full view is coming soon.')} hitSlop={8}><Text style={styles.seeAll}>See all</Text></Pressable></View>;
}

function GameCard({ game, onPress }: { game: SportsGame; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.gameCard, pressed && styles.cardPressed]}>
      <View style={styles.gameCardTop}><Text style={styles.gameLeague}>{game.league}</Text><Text style={[styles.gameStatus, game.status === 'LIVE' && styles.liveText]}>{game.status === 'UPCOMING' ? game.detail : game.status}</Text></View>
      <View style={styles.gameTeamRow}><TeamLogo team={game.away} size={34} /><Text numberOfLines={1} style={styles.gameTeamName}>{game.away.name}</Text><Text style={styles.gameScore}>{game.awayScore ?? '–'}</Text></View>
      <View style={styles.gameTeamRow}><TeamLogo team={game.home} size={34} /><Text numberOfLines={1} style={styles.gameTeamName}>{game.home.name}</Text><Text style={styles.gameScore}>{game.homeScore ?? '–'}</Text></View>
      <View style={styles.gameCardFooter}><Text style={styles.networkText}>{game.network}</Text><Text style={styles.gameDetail}>{game.status === 'UPCOMING' ? game.venue : game.detail}</Text></View>
    </Pressable>
  );
}

function FavoriteTeamCard({ team, favorite, onToggle }: { team: typeof FAVORITE_TEAMS[number]; favorite: boolean; onToggle: () => void }) {
  return (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteTop}><TeamLogo team={team} size={48} /><Pressable accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${team.name} favorite`} onPress={onToggle} style={({ pressed }) => [styles.starButton, favorite && styles.starButtonActive, pressed && styles.pressed]}><Text style={[styles.starText, favorite && styles.starTextActive]}>★</Text></Pressable></View>
      <Text numberOfLines={1} style={styles.favoriteName}>{team.name}</Text>
      <Text style={styles.favoriteRecord}>{team.record}</Text>
      <Text numberOfLines={1} style={styles.favoriteNext}>{team.next}</Text>
    </View>
  );
}

function OddsFormatPill({ active, format, onPress }: { active: boolean; format: OddsFormat; onPress: () => void }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(active ? 1.04 : 1, { duration: 170 });
  }, [active, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress} style={[styles.oddsPill, active && styles.oddsPillActive]}>
        <Text style={[styles.oddsPillText, active && styles.oddsPillTextActive]}>{format}</Text>
      </Pressable>
    </Animated.View>
  );
}

function OddsCard({ game, format, selected, favorite, onPress, onToggleFavorite, teamMeta }: { game: OddsGame; format: OddsFormat; selected: boolean; favorite: boolean; onPress: () => void; onToggleFavorite: () => void; teamMeta: typeof ODDS_TEAM_META }) {
  const values = game.odds[format];
  const statusLabel = game.status.replace('Tonight ·', 'TODAY').replace('Tomorrow ·', 'TOMORROW').replace('Sunday ·', 'SUNDAY');
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(selected ? 1.015 : 1, { duration: 150 });
  }, [scale, selected]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.oddsCardShell, animatedStyle]}>
    <Pressable
      accessibilityLabel={`Open ${game.away.name} at ${game.home.name} game details`}
      onPress={onPress}
      style={({ pressed }) => [styles.oddsCard, selected && styles.oddsCardSelected, pressed && styles.cardPressed]}>
      <View style={styles.oddsCardTop}>
        <Text style={styles.gameLeague}>{game.league}</Text>
        <View style={styles.oddsStatusBadge}><Text style={styles.oddsStatusIcon}>⏰</Text><Text style={styles.oddsStatus}>{statusLabel}</Text></View>
      </View>
      <OddsTeamRow meta={teamMeta[game.away.name]} team={game.away} value={values.away} movement={values.awayMovement} />
      <View style={styles.oddsTeamDivider} />
      <OddsTeamRow meta={teamMeta[game.home.name]} team={game.home} value={values.home} movement={values.homeMovement} />
      <View style={styles.oddsFooter}>
        <Text style={styles.oddsFormatLabel}>{format} · SIMULATED</Text>
        <Text style={styles.oddsUpdated}>Last Updated · {game.updated.replace('Updated ', '')}</Text>
      </View>
    </Pressable>
    <Pressable
      accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${game.away.short} at ${game.home.short} favorite`}
      onPress={onToggleFavorite}
      style={({ pressed }) => [styles.oddsFavoriteButton, favorite && styles.oddsFavoriteButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.oddsFavoriteIcon, favorite && styles.oddsFavoriteIconActive]}>★</Text>
    </Pressable>
    </Animated.View>
  );
}

function OddsTeamRow({ team, value, movement, meta = { record: '—', streak: '—', rank: '—' } }: { team: SportsTeam; value: string; movement: OddsMovement; meta?: typeof ODDS_TEAM_META[string] }) {
  return (
    <View style={styles.oddsTeamRow}>
      <TeamLogo team={team} size={40} />
      <View style={styles.oddsTeamCopy}>
        <Text numberOfLines={1} style={styles.oddsTeamName}>{team.name}</Text>
        <Text style={styles.oddsTeamMeta}>{meta.record}  ·  {meta.streak}  ·  {meta.rank}</Text>
      </View>
      <View style={styles.oddsValueDivider} />
      <View style={styles.oddsValueRow}>
        <Text style={styles.oddsValue}>{value.replace(/^\S+\s/, '')}</Text>
        {movement !== 'none' && <Text style={movement === 'up' ? styles.movementUp : styles.movementDown}>{movement === 'up' ? '▲ +0.5' : '▼ -1.0'}</Text>}
      </View>
    </View>
  );
}

function StandingsTable({ standings }: { standings: Standing[] }) {
  return (
    <View style={styles.standingsCard}>
      <View style={[styles.standingRow, styles.standingHeader]}><Text style={[styles.standingCell, styles.rankCell]}>#</Text><Text style={[styles.standingCell, styles.teamCell]}>TEAM</Text><Text style={styles.standingCell}>W</Text><Text style={styles.standingCell}>L</Text><Text style={[styles.standingCell, styles.pctCell]}>PCT</Text></View>
      {standings.map((standing, index) => (
        <View key={standing.short} style={[styles.standingRow, index < standings.length - 1 && styles.standingBorder]}>
          <Text style={[styles.standingValue, styles.rankCell]}>{index + 1}</Text><View style={styles.teamCell}><Text numberOfLines={1} style={styles.standingTeam}>{standing.team}</Text><Text style={styles.standingShort}>{standing.short}</Text></View><Text style={styles.standingValue}>{standing.wins}</Text><Text style={styles.standingValue}>{standing.losses}</Text><Text style={[styles.standingValue, styles.pctCell]}>{standing.pct}</Text>
        </View>
      ))}
    </View>
  );
}

function StoryRow({ story }: { story: Story }) {
  return (
    <Pressable onPress={() => Alert.alert(story.headline, `${story.source} · ${story.time}`)} style={({ pressed }) => [styles.storyRow, pressed && styles.cardPressed]}>
      <View style={[styles.storyThumb, { backgroundColor: story.colors[0] }]}><View style={[styles.storyOrb, { backgroundColor: story.colors[1] }]} /><Text style={styles.storyThumbText}>{story.league}</Text></View>
      <View style={styles.storyCopy}><Text style={styles.storyLeague}>{story.league}</Text><Text numberOfLines={2} style={styles.storyHeadline}>{story.headline}</Text><Text style={styles.storyMeta}>{story.source} · {story.time}</Text></View>
      <Text style={styles.storyArrow}>›</Text>
    </Pressable>
  );
}

function EmptyLeague({ league, stories = false }: { league: League; stories?: boolean }) {
  return <View style={styles.emptyCard}><Text style={styles.emptyIcon}>○</Text><Text style={styles.emptyTitle}>No {league} {stories ? 'stories' : 'games'} right now</Text><Text style={styles.emptyCopy}>Choose another league to see more local mock coverage.</Text></View>;
}

function ScreenState({ title, copy, loading = false, actionLabel, onAction }: { title: string; copy: string; loading?: boolean; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.stateScreen}>{loading ? <ActivityIndicator color="#69E08C" size="large" /> : <Text style={styles.stateMark}>!</Text>}<Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateCopy}>{copy}</Text>{actionLabel && onAction ? <Pressable onPress={onAction} style={styles.retryButton}><Text style={styles.retryText}>{actionLabel}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0E12' },
  content: { width: '100%', maxWidth: 1160, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#69E08C', fontSize: 11, fontWeight: '900', letterSpacing: 1.9, marginBottom: 7 },
  title: { color: '#FFFFFF', fontSize: 46, lineHeight: 50, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { color: '#8D96A3', fontSize: 16, marginTop: 6 },
  headerActions: { alignItems: 'center', gap: 10 },
  profileButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#233044', borderWidth: 1, borderColor: '#3A4B62', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: '#ECF2F8', fontSize: 12, fontWeight: '900' },
  filterButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  bellIcon: { color: '#69E08C', fontSize: 12 },
  ticker: { marginBottom: 24 },
  tickerContent: { gap: 10, paddingRight: 24 },
  tickerItem: { minWidth: 178, height: 58, backgroundColor: '#151B22', borderWidth: 1, borderColor: '#29333D', borderRadius: 14, justifyContent: 'center', paddingHorizontal: 13 },
  tickerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  tickerStatus: { color: '#929CA8', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  tickerTeams: { color: '#C9D0D8', fontSize: 12, fontWeight: '800' },
  tickerScore: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  tickerDetail: { color: '#737E8A', fontSize: 9, fontWeight: '700' },
  liveText: { color: '#69E08C' },
  simulatedDataLabel: { color: '#697582', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginTop: -16, marginBottom: 22, textAlign: 'right' },
  leagueRow: { gap: 9, paddingBottom: 30, paddingRight: 20 },
  leaguePill: { height: 38, minWidth: 67, borderRadius: 19, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 17 },
  leaguePillActive: { backgroundColor: '#69E08C', borderColor: '#69E08C' },
  leagueText: { color: '#98A2AE', fontSize: 13, fontWeight: '800' },
  leagueTextActive: { color: '#0A1510' },
  featuredCard: { minHeight: 344, borderRadius: 22, backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2B3540', padding: 24, overflow: 'hidden', marginBottom: 52 },
  featuredGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, right: -145, top: -180, opacity: 0.18 },
  featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(105,224,140,0.12)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#69E08C' },
  liveBadgeText: { color: '#69E08C', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  featuredLeague: { color: '#8D98A5', fontSize: 12, fontWeight: '700' },
  matchup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 32 },
  featuredTeam: { alignItems: 'center', gap: 8 },
  featuredTeamName: { color: '#E9EDF2', fontSize: 13, fontWeight: '800', textAlign: 'center', width: '100%' },
  teamLogo: { borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  teamLogoText: { color: '#FFFFFF', fontWeight: '900' },
  teamRecord: { color: '#727E8A', fontSize: 11, fontWeight: '700' },
  scoreBlock: { alignItems: 'center', minWidth: 85 },
  featuredScore: { color: '#FFFFFF', fontSize: 46, fontWeight: '900', letterSpacing: -1.5 },
  featuredScoreMobile: { fontSize: 34 },
  scoreDash: { color: '#606B77', fontWeight: '400' },
  gameClock: { color: '#69E08C', fontSize: 13, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303944', paddingTop: 17 },
  venueLabel: { color: '#697582', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  venueText: { color: '#BCC4CD', fontSize: 12, marginTop: 4 },
  viewGameButton: { backgroundColor: '#69E08C', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10 },
  viewGameText: { color: '#09140E', fontSize: 12, fontWeight: '900' },
  section: { marginBottom: 52 },
  sectionLast: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', letterSpacing: -0.45 },
  seeAll: { color: '#69E08C', fontSize: 13, fontWeight: '800' },
  horizontalCards: { gap: 16, paddingRight: 28, paddingBottom: 2 },
  gameCard: { width: 252, height: 190, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 15 },
  gameCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  gameLeague: { color: '#737E8A', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  gameStatus: { color: '#9CA6B1', fontSize: 10, fontWeight: '900' },
  gameTeamRow: { height: 45, flexDirection: 'row', alignItems: 'center', gap: 9 },
  gameTeamName: { flex: 1, color: '#E9EDF2', fontSize: 12, fontWeight: '800' },
  gameScore: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  gameCardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2C3540', paddingTop: 10, marginTop: 6 },
  networkText: { color: '#69E08C', fontSize: 10, fontWeight: '800' },
  gameDetail: { color: '#798490', fontSize: 10 },
  favoriteCard: { width: 220, height: 177, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 15 },
  favoriteTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  starButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#202731', alignItems: 'center', justifyContent: 'center' },
  starButtonActive: { backgroundColor: 'rgba(105,224,140,0.13)' },
  starText: { color: '#77828E', fontSize: 15 },
  starTextActive: { color: '#69E08C' },
  favoriteName: { color: '#F1F4F7', fontSize: 14, fontWeight: '900' },
  favoriteRecord: { color: '#A4ADB7', fontSize: 12, fontWeight: '700', marginTop: 6 },
  favoriteNext: { color: '#727E8A', fontSize: 11, marginTop: 7 },
  oddsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  oddsTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  simulatedBadge: { backgroundColor: 'rgba(105,224,140,0.1)', borderColor: 'rgba(105,224,140,0.28)', borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  simulatedText: { color: '#69E08C', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  oddsSelector: { backgroundColor: '#11161C', borderRadius: 19, flexDirection: 'row', gap: 5, marginBottom: 20, padding: 4, alignSelf: 'flex-start' },
  oddsPill: { alignItems: 'center', backgroundColor: 'transparent', borderColor: 'transparent', borderRadius: 15, borderWidth: 1, justifyContent: 'center', minHeight: 34, minWidth: 92, paddingHorizontal: 16 },
  oddsPillActive: { backgroundColor: '#58E17F', borderColor: '#80EDA0', shadowColor: '#69E08C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8 },
  oddsPillText: { color: '#98A2AE', fontSize: 11, fontWeight: '800' },
  oddsPillTextActive: { color: '#07120C', fontWeight: '900' },
  oddsCards: { gap: 18, paddingBottom: 6, paddingRight: 28 },
  oddsCardShell: { height: 276, position: 'relative', width: 380 },
  oddsCard: { backgroundColor: '#12181E', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 20, borderWidth: 1, height: 276, padding: 20, width: 380 },
  oddsCardSelected: { backgroundColor: '#142019', borderColor: '#69E08C', shadowColor: '#69E08C', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.12, shadowRadius: 18 },
  oddsCardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 19, paddingRight: 39 },
  oddsStatusBadge: { alignItems: 'center', backgroundColor: 'rgba(105,224,140,0.09)', borderColor: 'rgba(105,224,140,0.18)', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  oddsStatusIcon: { fontSize: 10 },
  oddsStatus: { color: '#A9E8BB', fontSize: 9, fontWeight: '900', letterSpacing: 0.35 },
  oddsTeamRow: { alignItems: 'center', flexDirection: 'row', gap: 12, height: 70 },
  oddsTeamDivider: { backgroundColor: 'rgba(255,255,255,0.055)', height: StyleSheet.hairlineWidth, marginLeft: 51 },
  oddsTeamCopy: { flex: 1, minWidth: 0 },
  oddsTeamName: { color: '#E9EDF2', fontSize: 15, fontWeight: '800' },
  oddsTeamMeta: { color: '#707C88', fontSize: 9, fontWeight: '700', marginTop: 7 },
  oddsValueDivider: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 13, width: StyleSheet.hairlineWidth },
  oddsValueRow: { alignItems: 'flex-end', gap: 5, minWidth: 78 },
  oddsValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  movementUp: { color: '#69E08C', fontSize: 9, fontWeight: '900' },
  movementDown: { color: '#FF6B76', fontSize: 9, fontWeight: '900' },
  oddsFooter: { borderTopColor: '#2C3540', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 13 },
  oddsFormatLabel: { color: '#69E08C', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  oddsUpdated: { color: '#707B87', fontSize: 9 },
  oddsFavoriteButton: { alignItems: 'center', backgroundColor: '#202731', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', position: 'absolute', right: 14, top: 14, width: 30 },
  oddsFavoriteButtonActive: { backgroundColor: 'rgba(105,224,140,0.14)', borderColor: 'rgba(105,224,140,0.35)' },
  oddsFavoriteIcon: { color: '#697580', fontSize: 13 },
  oddsFavoriteIconActive: { color: '#69E08C' },
  oddsInfoCard: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#11171D', borderColor: 'rgba(255,255,255,0.065)', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, marginTop: 16, paddingHorizontal: 12, paddingVertical: 10 },
  oddsInfoIcon: { borderColor: '#596570', borderRadius: 8, borderWidth: 1, color: '#8E99A5', fontSize: 9, fontWeight: '900', height: 16, lineHeight: 14, textAlign: 'center', width: 16 },
  oddsNote: { color: '#78838E', flexShrink: 1, fontSize: 10, lineHeight: 15 },
  standingsCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 16, overflow: 'hidden' },
  standingRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center' },
  standingHeader: { minHeight: 42 },
  standingBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#29313A' },
  standingCell: { width: 54, color: '#707C88', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  standingValue: { width: 54, color: '#D8DEE5', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  rankCell: { width: 34 },
  teamCell: { flex: 1, textAlign: 'left' },
  pctCell: { width: 66 },
  standingTeam: { color: '#E9EDF2', fontSize: 13, fontWeight: '800' },
  standingShort: { color: '#6F7A86', fontSize: 9, marginTop: 2 },
  storiesCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  storyRow: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  storyThumb: { width: 82, height: 66, borderRadius: 11, overflow: 'hidden', justifyContent: 'flex-end', padding: 8 },
  storyOrb: { position: 'absolute', width: 68, height: 68, borderRadius: 34, right: -19, top: -22, opacity: 0.88 },
  storyThumbText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  storyCopy: { flex: 1, minWidth: 0 },
  storyLeague: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  storyHeadline: { color: '#EFF2F6', fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 4 },
  storyMeta: { color: '#75808C', fontSize: 10, marginTop: 5 },
  storyArrow: { color: '#687481', fontSize: 24, paddingHorizontal: 4 },
  storyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 95 },
  emptyCard: { minHeight: 154, backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { color: '#69E08C', fontSize: 26 },
  emptyTitle: { color: '#F1F4F7', fontSize: 16, fontWeight: '900', marginTop: 9, textAlign: 'center' },
  emptyCopy: { color: '#7E8995', fontSize: 12, marginTop: 6, textAlign: 'center' },
  pressed: { opacity: 0.65 },
  cardPressed: { opacity: 0.75 },
  stateScreen: { flex: 1, backgroundColor: '#0B0E12', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  stateMark: { width: 48, height: 48, borderRadius: 24, lineHeight: 48, textAlign: 'center', color: '#FF8892', backgroundColor: '#352126', fontSize: 22, fontWeight: '900' },
  stateTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 17, textAlign: 'center' },
  stateCopy: { color: '#89939F', fontSize: 13, marginTop: 7, textAlign: 'center' },
  retryButton: { backgroundColor: '#69E08C', borderRadius: 20, paddingHorizontal: 19, paddingVertical: 10, marginTop: 20 },
  retryText: { color: '#09140E', fontSize: 13, fontWeight: '900' },
});
