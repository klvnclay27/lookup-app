import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BoxScoreColumn,
  GameCenterPlayer,
  SportsGameDetails,
  getGameDetails,
} from '../services/sports-game-center';

type Section = 'GAMECAST' | 'BOX SCORE' | 'PLAYERS' | 'MATCHUP';
const SECTIONS: Section[] = ['GAMECAST', 'BOX SCORE', 'PLAYERS', 'MATCHUP'];
const GREEN = '#80e619';
const MOBILE_CORE_STATS = ['pts', 'reb', 'ast', 'pf'];
const MOBILE_EXTRA_STATS = ['min', 'fg', 'threePt', 'ft', 'stl', 'blk', 'turnovers'];

function statusColor(status: SportsGameDetails['status']) {
  if (status === 'LIVE') return '#ef4444';
  if (status === 'FINAL') return '#94a3b8';
  if (status === 'HALFTIME' || status === 'INTERMISSION') return '#f59e0b';
  return '#60a5fa';
}

function getStat(player: GameCenterPlayer, column: BoxScoreColumn) {
  const direct: Record<string, string | number | undefined> = {
    min: player.gameStats.min,
    pts: player.gameStats.pts,
    reb: player.gameStats.reb,
    ast: player.gameStats.ast,
    pf: player.gameStats.pf,
    fg: player.gameStats.fg,
    threePt: player.gameStats.threePt,
    ft: player.gameStats.ft,
    stl: player.gameStats.stl,
    blk: player.gameStats.blk,
    turnovers: player.gameStats.turnovers,
  };
  return direct[column.key] ?? player.gameStats.values?.[column.key] ?? '—';
}

function TeamMark({ team, large = false }: { team: SportsGameDetails['awayTeam']; large?: boolean }) {
  return (
    <View style={[styles.teamMark, large && styles.teamMarkLarge, { borderColor: team.color }]}>
      <Text style={[styles.teamMarkText, large && styles.teamMarkTextLarge]}>{team.abbreviation}</Text>
    </View>
  );
}

export default function GameDetails() {
  const params = useLocalSearchParams<{ gameId?: string | string[] }>();
  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 760;
  const [game, setGame] = useState<SportsGameDetails>();
  const [loadError, setLoadError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('GAMECAST');
  const [selectedPlayer, setSelectedPlayer] = useState<GameCenterPlayer>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    getGameDetails(gameId ?? '').then((result) => {
      if (!active) return;
      setGame(result.data ?? undefined);
      setLoadError(result.provenance === 'unavailable' ? result.error : undefined);
      setSelectedPlayer(undefined);
      setSection('GAMECAST');
      setLoading(false);
    });
    return () => { active = false; };
  }, [gameId]);

  const playersByTeam = useMemo(() => game ? [
    { team: game.awayTeam, players: game.players.filter((player) => player.teamId === game.awayTeam.id) },
    { team: game.homeTeam, players: game.players.filter((player) => player.teamId === game.homeTeam.id) },
  ] : [], [game]);

  const backToSports = () => router.replace('/sports');

  if (loading) {
    return <View style={styles.statePage}><ActivityIndicator color={GREEN} size="large" /><Text style={styles.stateText}>Loading game center…</Text></View>;
  }

  if (!game) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateIcon}>!</Text>
        <Text style={styles.stateTitle}>Game unavailable</Text>
        <Text style={styles.stateText}>{loadError ?? 'We could not find details for this game.'}</Text>
        <Pressable onPress={backToSports} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Back to Sports</Text>
        </Pressable>
      </View>
    );
  }

  const score = (value?: number) => game.status === 'SCHEDULED' ? '—' : String(value ?? '—');
  const timing = game.status === 'SCHEDULED'
    ? game.scheduledTime ?? 'Time TBD'
    : [game.period, game.clock].filter(Boolean).join(' · ');
  const useMobileBasketballScore = !isDesktop && game.sport === 'basketball';
  const mobileCoreColumns = game.boxScoreColumns.filter((column) => MOBILE_CORE_STATS.includes(column.key));
  const mobileExtraColumns = game.boxScoreColumns.filter((column) => MOBILE_EXTRA_STATS.includes(column.key));

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20), paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.shell}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" onPress={backToSports} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backChevron}>‹</Text>
              <Text style={styles.backText}>Sports</Text>
            </Pressable>
            <Text style={styles.eyebrow}>SPORTS GAME CENTER</Text>
            <View style={styles.simulatedBadge}><Text style={styles.simulatedText}>SIMULATED</Text></View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.gameMetaRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(game.status) }]}><Text style={styles.statusText}>{game.statusLabel.toUpperCase()}</Text></View>
              <Text style={styles.metaText}>{game.league} · {game.broadcast}</Text>
            </View>
            <View style={[styles.scoreRow, !isDesktop && styles.scoreRowMobile]}>
              <View style={styles.teamColumn}>
                <TeamMark team={game.awayTeam} large />
                <Text style={styles.teamName}>{game.awayTeam.name}</Text>
                <Text style={styles.teamRecord}>{game.awayTeam.record}</Text>
              </View>
              <View style={styles.scoreCenter}>
                <View style={styles.scoreLine}>
                  <Text style={styles.score}>{score(game.awayScore)}</Text><Text style={styles.scoreDivider}>–</Text><Text style={styles.score}>{score(game.homeScore)}</Text>
                </View>
                <Text style={styles.timing}>{timing || game.statusLabel}</Text>
              </View>
              <View style={styles.teamColumn}>
                <TeamMark team={game.homeTeam} large />
                <Text style={styles.teamName}>{game.homeTeam.name}</Text>
                <Text style={styles.teamRecord}>{game.homeTeam.record}</Text>
              </View>
            </View>
            <View style={styles.venueRow}><Text style={styles.venuePin}>•</Text><Text style={styles.venueText}>{game.venue}</Text></View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {SECTIONS.map((item) => (
              <Pressable key={item} onPress={() => setSection(item)} style={({ pressed }) => [styles.tab, section === item && styles.tabActive, pressed && styles.pressed]}>
                <Text style={[styles.tabText, section === item && styles.tabTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {section === 'GAMECAST' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>GameCast</Text>
              <Text style={styles.sectionSubtitle}>Latest play first</Text>
              {game.gameCast.length === 0 ? <Text style={styles.emptyText}>Game updates will appear here when play begins.</Text> : game.gameCast.map((event, index) => (
                <View key={event.id} style={[styles.playRow, index > 0 && styles.divider]}>
                  <View style={styles.playTime}><Text style={styles.playPeriod}>{event.period}</Text><Text style={styles.playClock}>{event.clock}</Text></View>
                  <View style={styles.playDot} />
                  <View style={styles.playCopy}><Text style={styles.playDescription}>{event.description}</Text><Text style={styles.playType}>{event.type.replaceAll('-', ' ').toUpperCase()}</Text></View>
                  <Text style={styles.playScore}>{event.awayScore}–{event.homeScore}</Text>
                </View>
              ))}
            </View>
          )}

          {section === 'BOX SCORE' && (
            <View style={styles.stack}>
              {playersByTeam.map(({ team, players }) => (
                <View key={team.id} style={[styles.sectionCard, useMobileBasketballScore && styles.mobileBoxScoreCard]}>
                  <View style={styles.teamSectionHeader}><TeamMark team={team} /><View><Text style={styles.sectionTitle}>{team.name}</Text><Text style={styles.sectionSubtitle}>{team.record}</Text></View></View>
                  {players.length === 0 ? <Text style={styles.emptyText}>Player statistics are not available yet.</Text> : (
                    useMobileBasketballScore ? (
                      <View>
                        <View style={styles.mobileCoreTable}>
                          <View style={styles.tableRow}><Text style={[styles.tableHeader, styles.mobilePlayerCell]}>PLAYER</Text>{mobileCoreColumns.map((column) => <Text key={column.key} style={[styles.tableHeader, styles.mobileCoreStatCell]}>{column.label}</Text>)}</View>
                          {players.map((player) => (
                            <View key={player.id} style={[styles.tableRow, styles.tableDataRow]}>
                              <View style={styles.mobilePlayerCell}><Text numberOfLines={1} style={styles.mobileTablePlayer}>{player.name}</Text>{typeof player.gameStats.pf === 'number' && player.gameStats.pf >= 4 && <Text style={[styles.foulBadge, player.gameStats.pf >= 6 && styles.fouledOut]}>{player.gameStats.pf >= 6 ? 'FOULED OUT' : player.gameStats.pf === 5 ? '5 FOULS' : 'FOUL WATCH'}</Text>}</View>
                              {mobileCoreColumns.map((column) => <Text key={column.key} style={[styles.mobileCoreStatCell, styles.mobileCoreStatValue, column.emphasis && styles.statEmphasis]}>{getStat(player, column)}</Text>)}
                            </View>
                          ))}
                        </View>
                        <Text style={styles.moreStatsLabel}>MORE STATS · SWIPE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.mobileExtraScroll}>
                          <View style={styles.mobileExtraTable}>
                            <View style={styles.tableRow}><Text style={[styles.tableHeader, styles.mobileExtraPlayerCell]}>PLAYER</Text>{mobileExtraColumns.map((column) => <Text key={column.key} style={[styles.tableHeader, styles.statCell]}>{column.label}</Text>)}</View>
                            {players.map((player) => <View key={player.id} style={[styles.tableRow, styles.tableDataRow]}><Text numberOfLines={1} style={[styles.mobileExtraPlayerCell, styles.tablePlayer]}>{player.name}</Text>{mobileExtraColumns.map((column) => <Text key={column.key} style={[styles.statCell, styles.statValue]}>{getStat(player, column)}</Text>)}</View>)}
                          </View>
                        </ScrollView>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator>
                        <View style={styles.table}>
                          <View style={styles.tableRow}><Text style={[styles.tableHeader, styles.playerCell]}>PLAYER</Text>{game.boxScoreColumns.map((column) => <Text key={column.key} style={[styles.tableHeader, styles.statCell]}>{column.label}</Text>)}</View>
                          {players.map((player) => (
                            <View key={player.id} style={[styles.tableRow, styles.tableDataRow]}>
                              <View style={styles.playerCell}><Text numberOfLines={1} style={styles.tablePlayer}>{player.name}</Text>{typeof player.gameStats.pf === 'number' && player.gameStats.pf >= 4 && <Text style={[styles.foulBadge, player.gameStats.pf >= 6 && styles.fouledOut]}>{player.gameStats.pf >= 6 ? 'FOULED OUT' : player.gameStats.pf === 5 ? '5 FOULS' : 'FOUL WATCH'}</Text>}</View>
                              {game.boxScoreColumns.map((column) => <Text key={column.key} style={[styles.statCell, styles.statValue, column.emphasis && styles.statEmphasis]}>{getStat(player, column)}</Text>)}
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    )
                  )}
                </View>
              ))}
            </View>
          )}

          {section === 'PLAYERS' && (
            <View style={styles.stack}>
              {selectedPlayer && (
                <View style={[styles.sectionCard, styles.playerDetail]}>
                  <View style={styles.playerDetailTop}><View style={styles.avatar}><Text style={styles.avatarText}>{selectedPlayer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text></View><View><Text style={styles.sectionTitle}>{selectedPlayer.name}</Text><Text style={styles.sectionSubtitle}>#{selectedPlayer.jerseyNumber} · {selectedPlayer.position}</Text></View></View>
                  <View style={styles.playerStatStrip}><View><Text style={styles.bigStat}>{selectedPlayer.gameStats.pts ?? '—'}</Text><Text style={styles.statLabel}>PTS</Text></View><View><Text style={styles.bigStat}>{selectedPlayer.gameStats.reb ?? '—'}</Text><Text style={styles.statLabel}>REB</Text></View><View><Text style={styles.bigStat}>{selectedPlayer.gameStats.ast ?? '—'}</Text><Text style={styles.statLabel}>AST</Text></View><View><Text style={styles.bigStat}>{selectedPlayer.gameStats.pf ?? '—'}</Text><Text style={styles.statLabel}>PF</Text></View></View>
                  <Text style={styles.playerBio}>{selectedPlayer.seasonStats ? `Season: ${Object.entries(selectedPlayer.seasonStats).map(([label, value]) => `${label} ${value}`).join(' · ')}` : 'Season statistics are not available.'}</Text>
                </View>
              )}
              {playersByTeam.map(({ team, players }) => (
                <View key={team.id} style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>{team.name}</Text>
                  <View style={styles.playerGrid}>{players.map((player) => (
                    <Pressable key={player.id} onPress={() => setSelectedPlayer(player)} style={({ pressed }) => [styles.playerCard, selectedPlayer?.id === player.id && styles.playerCardSelected, pressed && styles.pressed]}>
                      <View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>{player.jerseyNumber}</Text></View><View style={styles.playerCardCopy}><Text style={styles.playerCardName}>{player.name}</Text><Text style={styles.sectionSubtitle}>{player.position} · {player.gameStats.pts ?? 0} PTS · {player.gameStats.reb ?? 0} REB · {player.gameStats.ast ?? 0} AST</Text></View><Text style={styles.forwardChevron}>›</Text>
                    </Pressable>
                  ))}</View>
                </View>
              ))}
            </View>
          )}

          {section === 'MATCHUP' && (
            <View style={styles.stack}>
              <View style={styles.sectionCard}><Text style={styles.sectionTitle}>Matchup outlook</Text><Text style={styles.matchupSummary}>{game.matchup.summary}</Text><Text style={styles.headToHead}>{game.matchup.headToHead}</Text></View>
              <View style={styles.sectionCard}>
                <View style={styles.comparisonHeader}><Text style={styles.comparisonTeam}>{game.awayTeam.abbreviation}</Text><Text style={styles.comparisonLabel}>TEAM COMPARISON</Text><Text style={styles.comparisonTeam}>{game.homeTeam.abbreviation}</Text></View>
                {game.matchup.comparisons.map((comparison, index) => <View key={comparison.label} style={[styles.comparisonRow, index > 0 && styles.divider]}><Text style={styles.comparisonValue}>{comparison.away}</Text><Text style={styles.comparisonName}>{comparison.label}</Text><Text style={styles.comparisonValue}>{comparison.home}</Text></View>)}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#070b12' },
  scrollContent: { paddingHorizontal: 20 },
  shell: { width: '100%', maxWidth: 1160, alignSelf: 'center', gap: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#121923' },
  backText: { color: '#f8fafc', fontWeight: '700' },
  backChevron: { color: '#f8fafc', fontSize: 24, lineHeight: 24 },
  eyebrow: { flex: 1, color: GREEN, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  simulatedBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(128,230,25,0.10)' },
  simulatedText: { color: GREEN, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroCard: { padding: 24, borderRadius: 24, backgroundColor: '#101721', borderWidth: 1, borderColor: '#253143' },
  gameMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: .8 },
  metaText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 28, gap: 42 },
  scoreRowMobile: { gap: 12 },
  teamColumn: { width: '28%', maxWidth: 230, alignItems: 'center', gap: 8 },
  teamMark: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#18212d', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  teamMarkLarge: { width: 64, height: 64, borderRadius: 32 },
  teamMarkText: { color: '#f8fafc', fontWeight: '900', fontSize: 11 },
  teamMarkTextLarge: { fontSize: 15 },
  teamName: { color: '#f8fafc', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  teamRecord: { color: '#8492a6', fontSize: 12 },
  scoreCenter: { minWidth: 120, alignItems: 'center', gap: 8 },
  scoreLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  score: { color: '#fff', fontSize: 40, lineHeight: 46, fontWeight: '900' },
  scoreDivider: { color: '#64748b', fontSize: 25 },
  timing: { color: GREEN, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  venueRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  venueText: { color: '#94a3b8', fontSize: 12 },
  venuePin: { color: '#94a3b8', fontSize: 18, lineHeight: 18 },
  tabs: { gap: 8 },
  tab: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 17, borderRadius: 999, borderWidth: 1, borderColor: '#273244', backgroundColor: '#111822' },
  tabActive: { borderColor: GREEN, backgroundColor: 'rgba(128,230,25,0.14)' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: .4 },
  tabTextActive: { color: GREEN },
  stack: { gap: 18 },
  sectionCard: { padding: 20, borderRadius: 20, backgroundColor: '#101721', borderWidth: 1, borderColor: '#222e3e' },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: '#8290a3', fontSize: 12, marginTop: 3 },
  emptyText: { color: '#94a3b8', fontSize: 14, lineHeight: 21, paddingVertical: 28, textAlign: 'center' },
  playRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: '#202b3a' },
  playTime: { width: 43, alignItems: 'flex-end' },
  playPeriod: { color: '#94a3b8', fontSize: 9, fontWeight: '800' },
  playClock: { color: '#f8fafc', fontSize: 13, fontWeight: '800' },
  playDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  playCopy: { flex: 1 },
  playDescription: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  playType: { color: '#64748b', fontSize: 9, fontWeight: '800', marginTop: 4 },
  playScore: { color: '#f8fafc', fontSize: 13, fontWeight: '800' },
  teamSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  mobileBoxScoreCard: { paddingHorizontal: 14 },
  mobileCoreTable: { width: '100%' },
  mobilePlayerCell: { flex: 1, minWidth: 88, paddingRight: 8 },
  mobileCoreStatCell: { width: 38, textAlign: 'center' },
  mobileTablePlayer: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  mobileCoreStatValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },
  moreStatsLabel: { color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: .7, marginTop: 18, marginBottom: 8 },
  mobileExtraScroll: { paddingRight: 12 },
  mobileExtraTable: { minWidth: 570 },
  mobileExtraPlayerCell: { width: 145, paddingRight: 10 },
  table: { minWidth: 760 },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  tableDataRow: { minHeight: 54, borderTopWidth: 1, borderTopColor: '#202b3a' },
  tableHeader: { color: '#64748b', fontSize: 10, fontWeight: '900' },
  playerCell: { width: 170, paddingRight: 10 },
  statCell: { width: 58, textAlign: 'center' },
  tablePlayer: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  statValue: { color: '#cbd5e1', fontSize: 12 },
  statEmphasis: { color: '#fff', fontWeight: '900' },
  foulBadge: { color: '#f59e0b', fontSize: 8, fontWeight: '900', marginTop: 3 },
  fouledOut: { color: '#ef4444' },
  playerDetail: { borderColor: 'rgba(128,230,25,0.45)' },
  playerDetailTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(128,230,25,0.14)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: GREEN, fontWeight: '900', fontSize: 16 },
  playerStatStrip: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#0b1119' },
  bigStat: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: '#718096', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  playerBio: { color: '#a8b3c3', fontSize: 13, lineHeight: 20 },
  playerGrid: { gap: 9, marginTop: 14 },
  playerCard: { flexDirection: 'row', alignItems: 'center', minHeight: 62, gap: 11, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#243043', backgroundColor: '#0c121b' },
  playerCardSelected: { borderColor: GREEN, backgroundColor: 'rgba(128,230,25,0.07)' },
  avatarSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1a2533', alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  playerCardCopy: { flex: 1 },
  playerCardName: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  forwardChevron: { color: '#64748b', fontSize: 24 },
  matchupSummary: { color: '#cbd5e1', fontSize: 16, lineHeight: 24, marginTop: 12 },
  headToHead: { color: GREEN, fontSize: 12, fontWeight: '800', marginTop: 12 },
  comparisonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  comparisonTeam: { width: 70, color: '#f8fafc', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  comparisonLabel: { flex: 1, color: '#64748b', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', minHeight: 54 },
  comparisonValue: { width: 85, color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  comparisonName: { flex: 1, color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  statePage: { flex: 1, backgroundColor: '#070b12', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  stateTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '900' },
  stateIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#94a3b8', color: '#94a3b8', fontSize: 24, fontWeight: '900', textAlign: 'center', lineHeight: 34 },
  stateText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
  primaryButton: { minHeight: 44, marginTop: 8, paddingHorizontal: 20, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#071006', fontWeight: '900' },
  pressed: { opacity: .76 },
});
