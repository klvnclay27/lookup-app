import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
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

import { isTabletWidth, pageHorizontalPadding } from '@/constants/layout';
import {
  getEntertainment,
  MOCK_ENTERTAINMENT_SNAPSHOT,
  searchEntertainment,
  type EntertainmentCategory as Category,
  type EntertainmentDataProvenance,
  type EntertainmentMediaTitle as MediaTitle,
  type EntertainmentSnapshot,
  type EntertainmentStory as Story,
  type EntertainmentStreamingPick as StreamingPick,
  type EntertainmentUpcoming as Upcoming,
} from '@/services/entertainment';

export default function EntertainmentScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isTabletWidth(width);
  const [entertainment, setEntertainment] = useState<EntertainmentSnapshot>(MOCK_ENTERTAINMENT_SNAPSHOT);
  const [provenance, setProvenance] = useState<EntertainmentDataProvenance>('unavailable');
  const [selectedCategory, setSelectedCategory] = useState<Category>('For You');
  const [selectedStory, setSelectedStory] = useState<Story>(MOCK_ENTERTAINMENT_SNAPSHOT.stories[0]);
  const [query, setQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(['north-star']);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>(['atlas']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntertainment = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getEntertainment();
    setProvenance(result.provenance);
    if (result.provenance === 'unavailable') setError(result.error);
    else {
      setEntertainment(result.data);
      setSelectedStory((current) => result.data.stories.find((story) => story.id === current.id) ?? result.data.stories[0] ?? current);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadEntertainment();
  }, []);

  const { categories, media, stories, streamingPicks, upcoming } = entertainment;

  const visibleStories = useMemo(
    () => selectedCategory === 'For You' ? stories : stories.filter((story) => story.category === selectedCategory),
    [selectedCategory, stories],
  );
  const visibleMedia = useMemo(
    () => selectedCategory === 'For You' ? media : media.filter((item) => item.category === selectedCategory),
    [media, selectedCategory],
  );
  const visibleUpcoming = useMemo(
    () => selectedCategory === 'For You' ? upcoming : upcoming.filter((item) => item.category === selectedCategory),
    [selectedCategory, upcoming],
  );
  const featuredStory = visibleStories.some((story) => story.id === selectedStory.id) ? selectedStory : visibleStories[0] ?? stories[0];

  const toggle = (id: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (isLoading) {
    return <ScreenState loading title="Loading your entertainment feed" copy="Finding what everyone’s watching…" />;
  }

  if (error) {
    return <ScreenState title="Entertainment is unavailable" copy={error} action="Try again" onAction={() => { void loadEntertainment(); }} />;
  }
  if (!featuredStory) return <ScreenState title="Entertainment is unavailable" copy="No entertainment content is available right now." action="Try again" onAction={() => { void loadEntertainment(); }} />;

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: pageHorizontalPadding(width), paddingBottom: insets.bottom + 140 },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR ENTERTAINMENT HUB</Text>
          <Text style={[styles.title, !isDesktop && styles.titleMobile]}>Entertainment</Text>
          <Text style={styles.subtitle}>What everyone’s watching.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable>
          <Pressable accessibilityLabel="Entertainment filters" onPress={() => Alert.alert('Filters', 'More entertainment filters are coming soon.')} style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}><Text style={styles.filterIcon}>≡</Text></Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Search entertainment"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search movies, shows, artists, stories"
          placeholderTextColor="#7E8793"
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><Text style={styles.clearIcon}>×</Text></Pressable>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((category) => {
          const active = selectedCategory === category;
          return <Pressable key={category} onPress={() => setSelectedCategory(category)} style={({ pressed }) => [styles.categoryPill, active && styles.categoryPillActive, pressed && styles.pressed]}><Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category}</Text></Pressable>;
        })}
      </ScrollView>
      {provenance === 'mock' ? <Text style={styles.simulatedDataLabel}>SIMULATED ENTERTAINMENT DATA</Text> : null}

      {query.trim() ? (
        <SearchResults entertainment={entertainment} query={query.trim()} onStory={setSelectedStory} />
      ) : (
        <>
          <FeaturedStory story={featuredStory} onRead={() => Alert.alert(featuredStory.headline, featuredStory.summary)} />

          <View style={styles.section}>
            <SectionHeader title="Trending Now" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
              {visibleStories.slice(0, 6).map((story) => <TrendingCard key={story.id} story={story} onPress={() => setSelectedStory(story)} />)}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Movies & TV" />
            {visibleMedia.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
                {visibleMedia.map((item) => <MediaCard key={item.id} item={item} saved={watchlist.includes(item.id)} onToggle={() => toggle(item.id, setWatchlist)} />)}
              </ScrollView>
            ) : <EmptyState title={`No ${selectedCategory} titles here`} copy="Try For You, Movies, or TV for more picks." />}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Celebrity Buzz" />
            <View style={styles.storiesCard}>
              {stories.filter((story) => story.category === 'Celebrity').slice(0, 4).map((story, index) => (
                <View key={story.id}>
                  <StoryRow story={story} saved={bookmarks.includes(story.id)} onSelect={() => setSelectedStory(story)} onBookmark={() => toggle(story.id, setBookmarks)} />
                  {index < 3 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Coming Soon" />
            {visibleUpcoming.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
                {visibleUpcoming.map((item) => <ComingCard key={item.id} item={item} active={reminders.includes(item.id)} onToggle={() => toggle(item.id, setReminders)} />)}
              </ScrollView>
            ) : <EmptyState title={`No ${selectedCategory} releases yet`} copy="More upcoming dates will appear here soon." />}
          </View>

          <View style={styles.sectionLast}>
            <SectionHeader title="Streaming Picks" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
              {streamingPicks.map((pick) => <StreamingCard key={pick.platform} pick={pick} />)}
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Artwork({ colors, label, poster = false }: { colors: [string, string]; label: string; poster?: boolean }) {
  return (
    <View style={[styles.artwork, poster && styles.posterArtwork, { backgroundColor: colors[0] }]}>
      <View style={[styles.artworkOrb, { backgroundColor: colors[1] }]} />
      <View style={styles.artworkBeam} />
      <View style={styles.artworkRing} />
      <Text numberOfLines={2} style={styles.artworkLabel}>{label}</Text>
    </View>
  );
}

function FeaturedStory({ story, onRead }: { story: Story; onRead: () => void }) {
  return (
    <View style={[styles.featuredCard, { backgroundColor: story.colors[0] }]}>
      <View style={[styles.featuredOrb, { backgroundColor: story.colors[1] }]} />
      <View style={styles.featuredBeam} />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        <Text style={styles.badge}>{story.category}</Text>
        <Text style={styles.featuredHeadline}>{story.headline}</Text>
        <Text numberOfLines={2} style={styles.featuredSummary}>{story.summary}</Text>
        <Text style={styles.featuredMeta}>{story.source} · {story.time}</Text>
        <Pressable onPress={onRead} style={({ pressed }) => [styles.readButton, pressed && styles.pressed]}><Text style={styles.readButtonText}>Read Story</Text></Pressable>
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={() => Alert.alert(title, 'The full collection is coming soon.')} hitSlop={8}><Text style={styles.seeAll}>See all</Text></Pressable></View>;
}

function TrendingCard({ story, onPress }: { story: Story; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.trendingCard, pressed && styles.cardPressed]}>
      <Artwork colors={story.colors} label={story.category} poster />
      <Text style={styles.cardCategory}>{story.category}</Text>
      <Text numberOfLines={2} style={styles.trendingHeadline}>{story.headline}</Text>
      <Text style={styles.cardMeta}>{story.source} · {story.time}</Text>
    </Pressable>
  );
}

function MediaCard({ item, saved, onToggle }: { item: MediaTitle; saved: boolean; onToggle: () => void }) {
  return (
    <View style={styles.mediaCard}>
      <Artwork colors={item.colors} label={item.title} poster />
      <Pressable accessibilityLabel={`${saved ? 'Remove' : 'Add'} ${item.title} watchlist`} onPress={onToggle} style={({ pressed }) => [styles.watchButton, saved && styles.actionActive, pressed && styles.pressed]}><Text style={[styles.watchIcon, saved && styles.actionIconActive]}>{saved ? '✓' : '+'}</Text></Pressable>
      <Text numberOfLines={1} style={styles.mediaTitle}>{item.title}</Text>
      <Text style={styles.mediaDetails}>{item.year} · {item.genre}</Text>
      <Text style={styles.rating}>★ {item.rating}</Text>
    </View>
  );
}

function StoryRow({ story, saved, onSelect, onBookmark }: { story: Story; saved: boolean; onSelect: () => void; onBookmark: () => void }) {
  return (
    <View style={styles.storyRow}>
      <Pressable onPress={onSelect} style={({ pressed }) => [styles.storyMain, pressed && styles.cardPressed]}>
        <View style={styles.storyThumbWrap}><Artwork colors={story.colors} label={story.category} /></View>
        <View style={styles.storyCopy}><Text style={styles.storyBadge}>{story.category}</Text><Text numberOfLines={2} style={styles.storyHeadline}>{story.headline}</Text><Text style={styles.storyMeta}>{story.source} · {story.time}</Text></View>
      </Pressable>
      <Pressable accessibilityLabel={`${saved ? 'Remove' : 'Add'} bookmark`} onPress={onBookmark} style={({ pressed }) => [styles.bookmarkButton, saved && styles.actionActive, pressed && styles.pressed]}><Text style={[styles.bookmarkIcon, saved && styles.actionIconActive]}>◆</Text></Pressable>
    </View>
  );
}

function ComingCard({ item, active, onToggle }: { item: Upcoming; active: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.comingCard, { backgroundColor: item.colors[0] }]}>
      <View style={[styles.comingOrb, { backgroundColor: item.colors[1] }]} />
      <View style={styles.comingTop}><Text style={styles.comingCategory}>{item.category}</Text><Pressable accessibilityLabel={`${active ? 'Remove' : 'Set'} reminder for ${item.title}`} onPress={onToggle} style={({ pressed }) => [styles.reminderButton, active && styles.reminderActive, pressed && styles.pressed]}><Text style={[styles.reminderIcon, active && styles.reminderIconActive]}>●</Text></Pressable></View>
      <View><Text style={styles.comingDate}>{item.date}</Text><Text style={styles.comingTitle}>{item.title}</Text><Text style={styles.comingGenre}>{item.genre}</Text><Text numberOfLines={2} style={styles.comingDescription}>{item.description}</Text></View>
    </View>
  );
}

function StreamingCard({ pick }: { pick: StreamingPick }) {
  return (
    <Pressable onPress={() => Alert.alert(`${pick.platform} picks`, pick.titles.join(' · '))} style={({ pressed }) => [styles.streamingCard, { backgroundColor: pick.colors[0] }, pressed && styles.cardPressed]}>
      <View style={[styles.streamingOrb, { backgroundColor: pick.colors[1] }]} />
      <View style={styles.platformLogo}><Text style={styles.platformLogoText}>{pick.platform.slice(0, 2).toUpperCase()}</Text></View>
      <Text style={styles.platformName}>{pick.platform}</Text>
      <View style={styles.streamingTitles}><Text numberOfLines={1} style={styles.streamingTitle}>{pick.titles[0]}</Text><Text numberOfLines={1} style={styles.streamingTitleMuted}>{pick.titles[1]}</Text></View>
    </Pressable>
  );
}

function SearchResults({ entertainment, query, onStory }: { entertainment: EntertainmentSnapshot; query: string; onStory: (story: Story) => void }) {
  const { media, stories, upcoming } = searchEntertainment(entertainment, query);
  const hasResults = stories.length + media.length + upcoming.length > 0;
  return (
    <View style={styles.searchResults}>
      <Text style={styles.sectionTitle}>Search results</Text>
      {!hasResults ? <EmptyState title={`No matches for “${query}”`} copy="Try a title, artist, story, source, or category." /> : (
        <View style={styles.resultsCard}>
          {stories.map((story) => <Pressable key={story.id} onPress={() => onStory(story)} style={({ pressed }) => [styles.resultRow, pressed && styles.cardPressed]}><View style={styles.resultThumb}><Artwork colors={story.colors} label={story.category} /></View><View style={styles.resultCopy}><Text style={styles.storyBadge}>{story.category}</Text><Text numberOfLines={1} style={styles.resultTitle}>{story.headline}</Text><Text style={styles.storyMeta}>{story.source} · {story.time}</Text></View></Pressable>)}
          {media.map((item) => <View key={item.id} style={styles.resultRow}><View style={styles.resultThumb}><Artwork colors={item.colors} label={item.category} /></View><View style={styles.resultCopy}><Text style={styles.storyBadge}>{item.category}</Text><Text style={styles.resultTitle}>{item.title}</Text><Text style={styles.storyMeta}>{item.year} · {item.genre} · ★ {item.rating}</Text></View></View>)}
          {upcoming.map((item) => <View key={item.id} style={styles.resultRow}><View style={styles.resultThumb}><Artwork colors={item.colors} label={item.category} /></View><View style={styles.resultCopy}><Text style={styles.storyBadge}>{item.category}</Text><Text style={styles.resultTitle}>{item.title}</Text><Text style={styles.storyMeta}>{item.date} · Coming soon</Text></View></View>)}
        </View>
      )}
    </View>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <View style={styles.emptyCard}><Text style={styles.emptyIcon}>○</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>;
}

function ScreenState({ title, copy, loading = false, action, onAction }: { title: string; copy: string; loading?: boolean; action?: string; onAction?: () => void }) {
  return <View style={styles.stateScreen}>{loading ? <ActivityIndicator color="#69E08C" size="large" /> : <Text style={styles.stateMark}>!</Text>}<Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateCopy}>{copy}</Text>{action && onAction ? <Pressable onPress={onAction} style={styles.retryButton}><Text style={styles.retryText}>{action}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0E12' },
  content: { width: '100%', maxWidth: 1160, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 27 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#69E08C', fontSize: 11, fontWeight: '900', letterSpacing: 1.9, marginBottom: 7 },
  title: { color: '#FFFFFF', fontSize: 44, lineHeight: 49, fontWeight: '900', letterSpacing: -1.5 },
  titleMobile: { fontSize: 36, lineHeight: 41, letterSpacing: -1.1 },
  subtitle: { color: '#8D96A3', fontSize: 16, marginTop: 6 },
  headerActions: { alignItems: 'center', gap: 10, marginLeft: 12 },
  profileButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#233044', borderWidth: 1, borderColor: '#3A4B62', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: '#ECF2F8', fontSize: 12, fontWeight: '900' },
  filterButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  filterIcon: { color: '#AEB7C2', fontSize: 18, fontWeight: '800', transform: [{ rotate: '90deg' }] },
  searchBar: { height: 54, borderRadius: 16, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  searchIcon: { color: '#A2ACB8', fontSize: 27, marginRight: 10, marginTop: -4 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 0 },
  clearIcon: { color: '#AAB3BE', fontSize: 25, paddingLeft: 10 },
  categoryRow: { gap: 9, paddingBottom: 30, paddingRight: 24 },
  simulatedDataLabel: { color: '#697582', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginTop: -20, marginBottom: 24, textAlign: 'right' },
  categoryPill: { height: 38, borderRadius: 19, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 17 },
  categoryPillActive: { backgroundColor: '#69E08C', borderColor: '#69E08C' },
  categoryText: { color: '#98A2AE', fontSize: 13, fontWeight: '800' },
  categoryTextActive: { color: '#0A1510' },
  featuredCard: { width: '100%', height: 360, borderRadius: 22, borderWidth: 1, borderColor: '#33404C', overflow: 'hidden', marginBottom: 52 },
  featuredOrb: { position: 'absolute', width: 520, height: 520, borderRadius: 260, right: -130, top: -220, opacity: 0.75 },
  featuredBeam: { position: 'absolute', width: '140%', height: 100, backgroundColor: 'rgba(255,255,255,0.1)', top: 85, left: -110, transform: [{ rotate: '-14deg' }] },
  featuredOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(5,8,12,0.46)' },
  featuredContent: { flex: 1, justifyContent: 'flex-end', padding: 26, maxWidth: 720 },
  badge: { alignSelf: 'flex-start', color: '#0A1510', backgroundColor: '#69E08C', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  featuredHeadline: { color: '#FFFFFF', fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.7, marginTop: 12 },
  featuredSummary: { color: '#C1C9D1', fontSize: 14, lineHeight: 20, marginTop: 9 },
  featuredMeta: { color: '#939DA8', fontSize: 11, marginTop: 10 },
  readButton: { alignSelf: 'flex-start', backgroundColor: '#69E08C', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, marginTop: 16 },
  readButtonText: { color: '#09140E', fontSize: 12, fontWeight: '900' },
  section: { marginBottom: 52 },
  sectionLast: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', letterSpacing: -0.45 },
  seeAll: { color: '#69E08C', fontSize: 13, fontWeight: '800' },
  horizontalCards: { gap: 17, paddingRight: 28, paddingBottom: 2 },
  artwork: { width: '100%', height: 118, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  posterArtwork: { height: 230 },
  artworkOrb: { position: 'absolute', width: '88%', aspectRatio: 1, borderRadius: 999, right: '-22%', top: '-20%', opacity: 0.9 },
  artworkBeam: { position: 'absolute', width: '150%', height: 30, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: '-27deg' }] },
  artworkRing: { width: '48%', aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  artworkLabel: { position: 'absolute', left: 11, bottom: 9, right: 11, color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  trendingCard: { width: 220, height: 346, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 11 },
  cardCategory: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 0.7, marginTop: 10 },
  trendingHeadline: { color: '#F1F4F7', fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 5 },
  cardMeta: { color: '#76818D', fontSize: 10, marginTop: 6 },
  mediaCard: { width: 180, height: 322, position: 'relative' },
  watchButton: { position: 'absolute', width: 34, height: 34, borderRadius: 17, right: 8, top: 188, backgroundColor: '#202832', borderWidth: 2, borderColor: '#11161C', alignItems: 'center', justifyContent: 'center' },
  watchIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  mediaTitle: { color: '#F3F6F9', fontSize: 14, fontWeight: '900', marginTop: 10 },
  mediaDetails: { color: '#7F8995', fontSize: 11, marginTop: 5 },
  rating: { color: '#D9B85F', fontSize: 11, fontWeight: '800', marginTop: 5 },
  actionActive: { backgroundColor: 'rgba(105,224,140,0.14)', borderColor: '#69E08C' },
  actionIconActive: { color: '#69E08C' },
  storiesCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  storyRow: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 8 },
  storyMain: { flex: 1, minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  storyThumbWrap: { width: 84, height: 68, overflow: 'hidden' },
  storyCopy: { flex: 1, minWidth: 0 },
  storyBadge: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  storyHeadline: { color: '#EFF2F6', fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 4 },
  storyMeta: { color: '#75808C', fontSize: 10, marginTop: 5 },
  bookmarkButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#202731', borderWidth: 1, borderColor: '#2C3540', alignItems: 'center', justifyContent: 'center' },
  bookmarkIcon: { color: '#7A8591', fontSize: 11 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 97 },
  comingCard: { width: 252, height: 166, borderRadius: 17, padding: 16, overflow: 'hidden', justifyContent: 'space-between' },
  comingOrb: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -55, top: -65, opacity: 0.88 },
  comingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comingCategory: { color: 'rgba(255,255,255,0.72)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  reminderButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(8,12,16,0.3)', alignItems: 'center', justifyContent: 'center' },
  reminderActive: { backgroundColor: '#69E08C' },
  reminderIcon: { color: '#A8B0B9', fontSize: 10 },
  reminderIconActive: { color: '#0A1510' },
  comingDate: { color: '#69E08C', fontSize: 10, fontWeight: '900' },
  comingTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 4 },
  comingGenre: { color: 'rgba(255,255,255,0.66)', fontSize: 9, fontWeight: '800', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.7 },
  comingDescription: { color: 'rgba(255,255,255,0.72)', fontSize: 11, lineHeight: 15, marginTop: 4, maxWidth: 190 },
  streamingCard: { width: 214, height: 154, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 15, overflow: 'hidden' },
  streamingOrb: { position: 'absolute', width: 145, height: 145, borderRadius: 73, right: -48, top: -52, opacity: 0.62 },
  platformLogo: { width: 35, height: 35, borderRadius: 10, backgroundColor: 'rgba(5,8,12,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  platformLogoText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  platformName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 11 },
  streamingTitles: { marginTop: 12, gap: 4 },
  streamingTitle: { color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: '800' },
  streamingTitleMuted: { color: 'rgba(255,255,255,0.56)', fontSize: 10 },
  searchResults: { minHeight: 360 },
  resultsCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, marginTop: 16 },
  resultRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 9 },
  resultThumb: { width: 66, height: 60, overflow: 'hidden' },
  resultCopy: { flex: 1, minWidth: 0 },
  resultTitle: { color: '#EFF2F6', fontSize: 14, fontWeight: '800', marginTop: 3 },
  emptyCard: { minHeight: 154, backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 16 },
  emptyIcon: { color: '#69E08C', fontSize: 26 },
  emptyTitle: { color: '#F1F4F7', fontSize: 16, fontWeight: '900', marginTop: 9, textAlign: 'center' },
  emptyCopy: { color: '#7E8995', fontSize: 12, marginTop: 6, textAlign: 'center' },
  stateScreen: { flex: 1, backgroundColor: '#0B0E12', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  stateMark: { width: 48, height: 48, borderRadius: 24, lineHeight: 48, textAlign: 'center', color: '#FF8892', backgroundColor: '#352126', fontSize: 22, fontWeight: '900' },
  stateTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 17, textAlign: 'center' },
  stateCopy: { color: '#89939F', fontSize: 13, marginTop: 7, textAlign: 'center' },
  retryButton: { backgroundColor: '#69E08C', borderRadius: 20, paddingHorizontal: 19, paddingVertical: 10, marginTop: 20 },
  retryText: { color: '#09140E', fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.65 },
  cardPressed: { opacity: 0.76 },
});
