import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  explicit?: boolean;
  colors: [string, string];
};

type Playlist = {
  id: string;
  title: string;
  description: string;
  colors: [string, string];
};

const RECENT_SONGS: Song[] = [
  { id: 'midnight', title: 'Midnight Drive', artist: 'Nova Lane', duration: '3:42', colors: ['#5836A5', '#D85B9B'] },
  { id: 'golden', title: 'Golden Hour', artist: 'Maya Rivers', duration: '3:18', colors: ['#B75B24', '#F1B84B'] },
  { id: 'satellite', title: 'Satellite Hearts', artist: 'The Wild North', duration: '4:05', colors: ['#176487', '#3BB5A5'] },
  { id: 'afterglow', title: 'Afterglow', artist: 'Soren Blue', duration: '2:58', colors: ['#773755', '#E2695D'] },
];

const TRENDING_SONGS: Song[] = [
  { id: 'not-like-us', title: 'Not Like Us', artist: 'Kendrick Lamar', duration: '4:34', explicit: true, colors: ['#685A4A', '#C3A77E'] },
  { id: 'like-that', title: 'Like That', artist: 'Future, Metro Boomin, Kendrick Lamar', duration: '4:27', explicit: true, colors: ['#3E4559', '#8391AF'] },
  { id: 'good-luck', title: 'Good Luck, Babe!', artist: 'Chappell Roan', duration: '3:38', colors: ['#A93461', '#F0859D'] },
  { id: 'type-shit', title: 'Type Shit', artist: 'Future, Metro Boomin, Travis Scott', duration: '3:48', explicit: true, colors: ['#49302B', '#B65A3D'] },
];

const ALL_SONGS = [...RECENT_SONGS, ...TRENDING_SONGS];

const PLAYLISTS: Playlist[] = [
  { id: 'mix-1', title: 'Daily Mix 1', description: 'Nova Lane, Ari Bloom and more', colors: ['#5B36A5', '#B468DE'] },
  { id: 'mix-2', title: 'Daily Mix 2', description: 'Maya Rivers, June Arcade and more', colors: ['#176846', '#64B86B'] },
  { id: 'chill', title: 'Chill Vibes', description: 'Soft sounds for slower moments', colors: ['#195C8C', '#55A9D3'] },
  { id: 'energy', title: 'Energy Shift', description: 'Big hooks and brighter beats', colors: ['#8C302F', '#E06B4F'] },
];

function Cover({ colors, size, label }: { colors: [string, string]; size: number; label?: string }) {
  return (
    <View style={[styles.cover, { width: size, height: size, backgroundColor: colors[0] }]}>
      <View style={[styles.coverGlow, { backgroundColor: colors[1] }]} />
      <View style={styles.coverSlash} />
      <View style={styles.coverRing} />
      <View style={[styles.coverDisc, { backgroundColor: colors[1] }]}>
        <View style={styles.coverDiscCore} />
      </View>
      {label ? <Text style={styles.coverLabel}>{label}</Text> : null}
    </View>
  );
}

function IconButton({ label, icon, onPress, active = false, large = false }: { label: string; icon: string; onPress: () => void; active?: boolean; large?: boolean }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, large && styles.iconButtonLarge, active && styles.iconButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.iconButtonText, active && styles.iconButtonTextActive, large && styles.iconButtonTextLarge]}>{icon}</Text>
    </Pressable>
  );
}

export default function MusicScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const recentSize = isDesktop ? 156 : 136;
  const playlistWidth = isDesktop ? 232 : 212;

  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song>(RECENT_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSongs = useMemo(
    () => ALL_SONGS.filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  );
  const filteredPlaylists = useMemo(
    () => PLAYLISTS.filter((playlist) => `${playlist.title} ${playlist.description}`.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  );

  const selectSong = (song: Song) => {
    setSelectedSong(song);
    setIsPlaying(true);
  };

  const skipSong = (direction: -1 | 1) => {
    const currentIndex = ALL_SONGS.findIndex((song) => song.id === selectedSong.id);
    const nextIndex = (currentIndex + direction + ALL_SONGS.length) % ALL_SONGS.length;
    selectSong(ALL_SONGS[nextIndex]);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#69E08C" size="large" />
        <Text style={styles.loadingText}>Loading your soundtrack…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 20) + 28,
            paddingHorizontal: isDesktop ? 32 : 20,
            paddingBottom: 210,
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR SOUNDTRACK</Text>
            <Text style={styles.title}>Music</Text>
            <Text style={styles.subtitle}>Play it your way.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
              <Text style={styles.profileText}>LU</Text>
            </Pressable>
            <Pressable accessibilityLabel="Music filters" onPress={() => Alert.alert('Music filters', 'Filter controls are coming soon.')} style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
              <Text style={styles.filterIcon}>≡</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search songs, artists, playlists"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search songs, artists, playlists"
            placeholderTextColor="#7E8793"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 && (
            <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>×</Text>
            </Pressable>
          )}
        </View>

        {normalizedQuery ? (
          <SearchResults
            playlists={filteredPlaylists}
            songs={filteredSongs}
            query={query.trim()}
            selectedSong={selectedSong}
            isPlaying={isPlaying}
            onClear={() => setQuery('')}
            onSelect={selectSong}
            onTogglePlay={(song) => selectedSong.id === song.id ? setIsPlaying((current) => !current) : selectSong(song)}
          />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title="Recently Played" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                {RECENT_SONGS.map((song) => (
                  <View key={song.id} style={[styles.recentCard, { width: recentSize }]}>
                    <Pressable onPress={() => selectSong(song)} style={({ pressed }) => pressed && styles.cardPressed}>
                      <Cover colors={song.colors} size={recentSize} />
                      <Text numberOfLines={1} style={styles.recentTitle}>{song.title}</Text>
                      <Text numberOfLines={1} style={styles.recentArtist}>{song.artist}</Text>
                    </Pressable>
                    <Pressable accessibilityLabel={`Play ${song.title}`} onPress={() => selectSong(song)} style={({ pressed }) => [styles.coverPlayButton, { top: recentSize - 46 }, pressed && styles.pressed]}>
                      <Text style={styles.coverPlayIcon}>▶</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Made for You" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                {PLAYLISTS.map((playlist, index) => (
                  <Pressable
                    key={playlist.id}
                    onPress={() => selectSong(RECENT_SONGS[index])}
                    style={({ pressed }) => [styles.playlistCard, { width: playlistWidth, backgroundColor: playlist.colors[0] }, pressed && styles.cardPressed]}>
                    <View style={[styles.playlistGlow, { backgroundColor: playlist.colors[1] }]} />
                    <Text style={styles.playlistKicker}>MADE FOR YOU</Text>
                    <View style={styles.playlistText}>
                      <Text style={styles.playlistTitle}>{playlist.title}</Text>
                      <Text numberOfLines={2} style={styles.playlistDescription}>{playlist.description}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionLast}>
              <SectionHeader title="Trending Now" />
              <View style={styles.trendingCard}>
                {TRENDING_SONGS.map((song, index) => (
                  <View key={song.id}>
                    <TrendingRow
                      song={song}
                      rank={index + 1}
                      favorite={favorites.includes(song.id)}
                      onSelect={selectSong}
                      onFavorite={() => toggleFavorite(song.id)}
                    />
                    {index < TRENDING_SONGS.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.playerDock} pointerEvents="box-none">
        <View style={styles.playerShell}>
          <View style={styles.playerRow}>
            <Pressable
              accessibilityLabel="Open Now Playing"
              onPress={() => Alert.alert('Now Playing', `${selectedSong.title} — ${selectedSong.artist}`)}
              style={({ pressed }) => [styles.playerSong, pressed && styles.playerPressed]}>
              <Cover colors={selectedSong.colors} size={48} />
              <View style={styles.playerMeta}>
                <Text numberOfLines={1} style={styles.playerTitle}>{selectedSong.title}</Text>
                <Text numberOfLines={1} style={styles.playerArtist}>{selectedSong.artist}</Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>1:24</Text>
                  <View style={styles.inlineProgress}><View style={styles.inlineProgressFill} /></View>
                  <Text style={styles.timeText}>{selectedSong.duration}</Text>
                </View>
              </View>
            </Pressable>
            <View style={styles.playerControls}>
              <IconButton label="Previous song" icon="|◀" onPress={() => skipSong(-1)} />
              <IconButton label={isPlaying ? 'Pause song' : 'Play song'} icon={isPlaying ? 'Ⅱ' : '▶'} large onPress={() => setIsPlaying((current) => !current)} />
              <IconButton label="Next song" icon="▶|" onPress={() => skipSong(1)} />
              <IconButton label={favorites.includes(selectedSong.id) ? 'Remove from favorites' : 'Add to favorites'} icon="♥" active={favorites.includes(selectedSong.id)} onPress={() => toggleFavorite(selectedSong.id)} />
            </View>
          </View>
          <View style={styles.playerIndicator}><View style={styles.playerIndicatorFill} /></View>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={() => Alert.alert(title, 'The full collection is coming soon.')} hitSlop={8}>
        <Text style={styles.seeAll}>See all</Text>
      </Pressable>
    </View>
  );
}

function TrendingRow({ song, rank, favorite, onSelect, onFavorite }: { song: Song; rank: number; favorite: boolean; onSelect: (song: Song) => void; onFavorite: () => void }) {
  return (
    <View style={styles.trendingRow}>
      <Pressable onPress={() => onSelect(song)} style={({ pressed }) => [styles.trendingMain, pressed && styles.cardPressed]}>
        <Text style={styles.rank}>{rank}</Text>
        <Cover colors={song.colors} size={50} />
        <View style={styles.trackMeta}>
          <View style={styles.trackTitleRow}>
            <Text numberOfLines={1} style={styles.trackTitle}>{song.title}</Text>
            {song.explicit && <Text style={styles.explicitBadge}>E</Text>}
          </View>
          <Text numberOfLines={1} style={styles.trackArtist}>{song.artist}</Text>
        </View>
      </Pressable>
      <IconButton label={favorite ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`} icon="♥" active={favorite} onPress={onFavorite} />
      <IconButton label={`More options for ${song.title}`} icon="•••" onPress={() => Alert.alert(song.title, 'More song options are coming soon.')} />
    </View>
  );
}

function SearchResults({ playlists, songs, query, selectedSong, isPlaying, onClear, onSelect, onTogglePlay }: { playlists: Playlist[]; songs: Song[]; query: string; selectedSong: Song; isPlaying: boolean; onClear: () => void; onSelect: (song: Song) => void; onTogglePlay: (song: Song) => void }) {
  const hasResults = playlists.length > 0 || songs.length > 0;
  return (
    <View style={styles.searchResults}>
      <Text style={styles.sectionTitle}>Search results</Text>
      {!hasResults ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyMark}>♫</Text>
          <Text style={styles.emptyTitle}>No matches for “{query}”</Text>
          <Text style={styles.emptyCopy}>Try a song, artist, or playlist name.</Text>
          <Pressable onPress={onClear} style={styles.clearButton}><Text style={styles.clearButtonText}>Clear search</Text></Pressable>
        </View>
      ) : (
        <View style={styles.resultsCard}>
          {playlists.map((playlist) => (
            <View key={playlist.id} style={styles.resultRow}>
              <Cover colors={playlist.colors} size={50} label="MIX" />
              <View style={styles.trackMeta}>
                <Text style={styles.trackTitle}>{playlist.title}</Text>
                <Text style={styles.trackArtist}>Playlist · {playlist.description}</Text>
              </View>
            </View>
          ))}
          {songs.map((song) => (
            <View key={song.id} style={styles.resultRow}>
              <Pressable onPress={() => onSelect(song)} style={({ pressed }) => [styles.resultMain, pressed && styles.cardPressed]}>
                <Cover colors={song.colors} size={50} />
                <View style={styles.trackMeta}>
                  <Text style={styles.trackTitle}>{song.title}</Text>
                  <Text style={styles.trackArtist}>{song.artist} · {song.duration}</Text>
                </View>
              </Pressable>
              <IconButton label={isPlaying && selectedSong.id === song.id ? 'Pause song' : 'Play song'} icon={isPlaying && selectedSong.id === song.id ? 'Ⅱ' : '▶'} active onPress={() => onTogglePlay(song)} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0E12' },
  content: { width: '100%', maxWidth: 1160, alignSelf: 'center' },
  loadingScreen: { flex: 1, backgroundColor: '#0B0E12', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#919AA7', fontSize: 14, marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#69E08C', fontSize: 11, fontWeight: '900', letterSpacing: 1.9, marginBottom: 7 },
  title: { color: '#FFFFFF', fontSize: 46, lineHeight: 50, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { color: '#8D96A3', fontSize: 16, marginTop: 6 },
  headerActions: { alignItems: 'center', gap: 10 },
  profileButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#233044', borderWidth: 1, borderColor: '#3A4B62', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: '#ECF2F8', fontSize: 12, fontWeight: '900' },
  filterButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  filterIcon: { color: '#AEB7C2', fontSize: 18, fontWeight: '800', transform: [{ rotate: '90deg' }] },
  searchBar: { height: 54, borderRadius: 16, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 38 },
  searchIcon: { color: '#A2ACB8', fontSize: 27, lineHeight: 29, marginRight: 10, marginTop: -4 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 0 },
  clearIcon: { color: '#AAB3BE', fontSize: 25, paddingLeft: 10 },
  section: { marginBottom: 48 },
  sectionLast: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', letterSpacing: -0.45 },
  seeAll: { color: '#69E08C', fontSize: 13, fontWeight: '800' },
  horizontalRow: { gap: 18, paddingRight: 28, paddingBottom: 2 },
  recentCard: { position: 'relative' },
  recentTitle: { color: '#F5F7FA', fontSize: 15, fontWeight: '800', marginTop: 10 },
  recentArtist: { color: '#8D96A2', fontSize: 13, marginTop: 4 },
  cover: { borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverGlow: { position: 'absolute', width: '82%', height: '82%', borderRadius: 999, right: '-18%', bottom: '-18%', opacity: 0.94 },
  coverSlash: { position: 'absolute', width: '145%', height: '24%', backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: '-28deg' }] },
  coverRing: { position: 'absolute', width: '68%', height: '68%', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', left: '-18%', top: '-14%' },
  coverDisc: { width: '43%', height: '43%', borderRadius: 999, borderWidth: 8, borderColor: 'rgba(10,12,16,0.28)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 8 },
  coverDiscCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.78)' },
  coverLabel: { position: 'absolute', left: 8, bottom: 7, color: 'rgba(255,255,255,0.9)', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  coverPlayButton: { position: 'absolute', width: 38, height: 38, borderRadius: 19, right: 8, backgroundColor: '#69E08C', borderWidth: 3, borderColor: '#101419', alignItems: 'center', justifyContent: 'center' },
  coverPlayIcon: { color: '#0B1510', fontSize: 13, fontWeight: '900', marginLeft: 2 },
  playlistCard: { width: 232, height: 150, borderRadius: 18, padding: 17, overflow: 'hidden', justifyContent: 'space-between' },
  playlistGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -50, top: -58, opacity: 0.9 },
  playlistKicker: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  playlistText: { maxWidth: '82%' },
  playlistTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  playlistDescription: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 16, marginTop: 5 },
  trendingCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#252D37', borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  trendingRow: { height: 74, flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendingMain: { flex: 1, height: 74, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 20, color: '#69E08C', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  trackMeta: { flex: 1, minWidth: 0 },
  trackTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trackTitle: { color: '#F4F7FA', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  trackArtist: { color: '#89939F', fontSize: 12, marginTop: 5 },
  explicitBadge: { color: '#AAB2BC', backgroundColor: '#303741', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, fontSize: 8, fontWeight: '900' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 82 },
  iconButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconButtonLarge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#69E08C' },
  iconButtonActive: { backgroundColor: 'rgba(105,224,140,0.12)' },
  iconButtonText: { color: '#98A2AE', fontSize: 13, fontWeight: '900' },
  iconButtonTextActive: { color: '#69E08C' },
  iconButtonTextLarge: { color: '#0A1510', fontSize: 14 },
  pressed: { opacity: 0.65 },
  cardPressed: { opacity: 0.76 },
  playerDock: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, elevation: 20, alignItems: 'center', paddingHorizontal: 12 },
  playerShell: { width: '100%', maxWidth: 1136, height: 72, borderRadius: 14, backgroundColor: '#202832', borderWidth: 1, borderColor: '#34404C', shadowColor: '#000000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.34, shadowRadius: 10, elevation: 20, overflow: 'hidden' },
  playerRow: { height: 69, flexDirection: 'row', alignItems: 'center', paddingRight: 9 },
  playerSong: { flex: 1, minWidth: 0, height: 69, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, gap: 10 },
  playerPressed: { backgroundColor: '#28323E' },
  playerMeta: { flex: 1, minWidth: 70, maxWidth: 440 },
  playerTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  playerArtist: { color: '#9EA8B3', fontSize: 11, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  timeText: { color: '#7E8995', fontSize: 9 },
  inlineProgress: { flex: 1, maxWidth: 160, height: 2, backgroundColor: '#4B5662', borderRadius: 1 },
  inlineProgressFill: { width: '36%', height: 2, backgroundColor: '#69E08C', borderRadius: 1 },
  playerControls: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  playerIndicator: { height: 2, backgroundColor: '#3D4853' },
  playerIndicatorFill: { width: '36%', height: 2, backgroundColor: '#69E08C' },
  searchResults: { minHeight: 300 },
  emptyCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#252D37', borderRadius: 18, alignItems: 'center', padding: 36, marginTop: 16 },
  emptyMark: { color: '#69E08C', fontSize: 30 },
  emptyTitle: { color: '#F6F8FA', fontSize: 17, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  emptyCopy: { color: '#8C96A2', fontSize: 13, textAlign: 'center', marginTop: 7 },
  clearButton: { backgroundColor: '#25313D', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, marginTop: 20 },
  clearButtonText: { color: '#EAF0F6', fontSize: 13, fontWeight: '800' },
  resultsCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#252D37', borderRadius: 18, paddingHorizontal: 15, marginTop: 16 },
  resultRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultMain: { flex: 1, minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
