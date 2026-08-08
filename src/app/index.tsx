import AsyncStorage from '@react-native-async-storage/async-storage';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getEntertainment } from '@/services/entertainment';
import { generateDailyIntelligence, getDailyIntelligence, type DailyIntelligenceResult } from '@/services/daily-intelligence';
import { getFinance } from '@/services/finance';
import { getMusic } from '@/services/music';

type IconName = SymbolViewProps['name'];
type Action = { label: string; route: Href; icon: IconName; color: string; tint: string };

const COLORS = {
  ink: '#14243A', muted: '#66758A', green: '#1FA968', line: '#DCE7F1', surface: '#FFFFFF', canvas: '#EFF8FF',
};

const ACTIONS: Action[] = [
  { label: 'Weather', route: '/weather', icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' }, color: '#2D8FD5', tint: '#E7F4FF' },
  { label: 'Traffic', route: '/traffic', icon: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' }, color: '#E47745', tint: '#FFF0E8' },
  { label: 'Flights', route: '/traffic', icon: { ios: 'airplane', android: 'flight', web: 'flight' }, color: '#665BD6', tint: '#EFEDFF' },
  { label: 'Sports', route: '/sports', icon: { ios: 'basketball.fill', android: 'sports_basketball', web: 'sports_basketball' }, color: '#E2952C', tint: '#FFF5DF' },
  { label: 'Finance', route: '/finance', icon: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }, color: '#159A62', tint: '#E5F8EF' },
  { label: 'Music', route: '/music', icon: { ios: 'music.note', android: 'music_note', web: 'music_note' }, color: '#B14EC2', tint: '#FAEAFC' },
  { label: 'Entertainment', route: '/entertainment', icon: { ios: 'film.fill', android: 'movie', web: 'movie' }, color: '#DA4E69', tint: '#FDEAF0' },
  { label: 'My Locker', route: '/my-locker', icon: { ios: 'tshirt.fill', android: 'checkroom', web: 'checkroom' }, color: '#5077C8', tint: '#EAF0FC' },
];

const MARKET_MOVERS = [
  { symbol: 'NVDA', company: 'NVIDIA', value: '+2.8%', up: true },
  { symbol: 'AAPL', company: 'Apple', value: '+1.4%', up: true },
  { symbol: 'TSLA', company: 'Tesla', value: '-0.9%', up: false },
];

const INTELLIGENCE_PREFERENCE_KEY = 'lookup.dailyIntelligence.enabled.v1';

function Icon({ name, color = COLORS.ink, size = 20 }: { name: IconName; color?: string; size?: number }) {
  return <SymbolView fallback={<Text style={{ color, fontSize: size * 0.65 }}>{'\u25CF'}</Text>} name={name} size={size} tintColor={color} />;
}

function SectionHeader({ action, label, title }: { action?: string; label?: string; title: string }) {
  return <View style={styles.sectionHeader}><View>{label ? <Text style={styles.sectionLabel}>{label}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{action ? <Text style={styles.sectionAction}>{action}</Text> : null}</View>;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const tablet = width >= 600 && width < 900;
  const [temperature, setTemperature] = useState(72);
  const [condition, setCondition] = useState('Sunny');
  const [loading, setLoading] = useState(true);
  const [commute, setCommute] = useState('28 mins');
  const [market, setMarket] = useState('S&P +0.8%');
  const [playlist, setPlaylist] = useState('Daily Mix');
  const [movie, setMovie] = useState('Top entertainment story');
  const [tracks, setTracks] = useState<string[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [dailyIntelligence, setDailyIntelligence] = useState<DailyIntelligenceResult>(() => generateDailyIntelligence({}));
  const [intelligenceEnabled, setIntelligenceEnabled] = useState(true);
  const [search, setSearch] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(INTELLIGENCE_PREFERENCE_KEY)
      .then((stored) => { if (stored !== null) setIntelligenceEnabled(stored === 'true'); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        await Promise.all([
          getDailyIntelligence().then((data) => {
            setDailyIntelligence(data);
            if (data.sources.weather) { setTemperature(data.sources.weather.temperature ?? 72); setCondition(data.sources.weather.condition ?? 'Unknown'); }
            else setCondition('Weather unavailable');
            setCommute(data.sources.traffic?.commute ?? 'Traffic unavailable');
            setGames(data.sources.sports?.games ?? ['Sports unavailable']);
          }),
          getFinance().then((data) => setMarket(data.market)).catch(() => setMarket('Market unavailable')),
          getEntertainment().then((data) => setMovie(data.movie)).catch(() => setMovie('Entertainment unavailable')),
          getMusic().then((data) => { setPlaylist(data.playlist); setTracks(data.tracks); }).catch(() => { setPlaylist('Music unavailable'); setTracks([]); }),
        ]);
      } finally { setLoading(false); }
    }
    void loadDashboard();
  }, []);

  const updateIntelligencePreference = (enabled: boolean) => {
    setIntelligenceEnabled(enabled);
    void AsyncStorage.setItem(INTELLIGENCE_PREFERENCE_KEY, String(enabled));
  };

  const feelsLike = temperature - 1;
  const briefing = [
    { title: 'Traffic', copy: `Leave in 12 minutes for a ${commute} commute`, value: commute, route: '/traffic' as Href, action: undefined, icon: ACTIONS[1] },
    { title: 'Knicks vs Celtics', copy: games[0] ?? 'Tonight at Madison Square Garden', value: '7:30 PM', route: '/sports' as Href, action: undefined, icon: ACTIONS[3] },
    { title: 'Weather', copy: `${condition} throughout the afternoon`, value: `${temperature}°`, route: '/weather' as Href, action: undefined, icon: ACTIONS[0] },
    { title: 'Calendar', copy: 'Two events remaining today', value: '2 events', route: undefined, action: () => Alert.alert('Calendar', 'Calendar integration is coming soon.'), icon: { ...ACTIONS[2], color: '#5077C8', tint: '#EAF0FC', icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as IconName } },
    { title: 'Top Story', copy: movie, value: '5 min', route: '/entertainment' as Href, action: undefined, icon: ACTIONS[6] },
    { title: 'Your Playlist', copy: tracks[0] ?? playlist, value: 'Play', route: '/music' as Href, action: undefined, icon: ACTIONS[5] },
  ];

  const trends = [
    { category: 'NEWS', title: 'The stories shaping business and technology today', time: '12 min ago', route: '/finance' as Href, colors: ['#CBE7FA', '#7CB5DE'], icon: { ios: 'newspaper.fill', android: 'newspaper', web: 'newspaper' } as IconName },
    { category: 'SPORTS', title: games[0] ?? 'New York gets ready for a big night in sports', time: '24 min ago', route: '/sports' as Href, colors: ['#FFE2C0', '#E59A4F'], icon: ACTIONS[3].icon },
    { category: 'ENTERTAINMENT', title: movie, time: '38 min ago', route: '/entertainment' as Href, colors: ['#F4D8ED', '#C878B6'], icon: ACTIONS[6].icon },
  ];

  const intelligenceDetails = [
    { category: 'sports' as const, icon: ACTIONS[3].icon, fallbackTitle: 'Game on today', fallbackDetail: games[0] ?? 'Sports schedule unavailable' },
    { category: 'weather' as const, icon: ACTIONS[0].icon, fallbackTitle: 'Comfortable conditions', fallbackDetail: `${condition} and ${temperature}° are expected right now.` },
    { category: 'traffic' as const, icon: ACTIONS[1].icon, fallbackTitle: 'Commute check', fallbackDetail: `Current travel time is approximately ${commute}.` },
  ].map((item) => ({ ...item, insight: dailyIntelligence.insights.find((insight) => insight.category === item.category) }));

  return <View style={styles.screen}>
    <View pointerEvents="none" style={[styles.backgroundBranding, !desktop && styles.backgroundBrandingMobile]}>
      <View style={[styles.backgroundWordmark, desktop ? styles.backgroundWordmarkDesktop : tablet ? styles.backgroundWordmarkTablet : styles.backgroundWordmarkMobile]}>
        <Text style={[styles.backgroundLook, desktop ? styles.backgroundTextDesktop : tablet ? styles.backgroundTextTablet : styles.backgroundTextMobile]}>look</Text>
        <Text style={[styles.backgroundUp, desktop ? styles.backgroundTextDesktop : tablet ? styles.backgroundTextTablet : styles.backgroundTextMobile]}>UP</Text>
      </View>
    </View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140, paddingHorizontal: desktop ? 32 : 18, paddingTop: Math.max(insets.top, 14) + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scrollLayer}>
    <View style={[styles.topBar, !desktop && styles.topBarMobile]}>
      <View style={styles.wordmark}><Text style={styles.wordmarkLook}>look</Text><Text style={styles.wordmarkUp}>UP</Text></View>
      <View style={[styles.searchBar, !desktop && styles.searchBarMobile]}><Icon color="#8190A2" name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} /><TextInput accessibilityLabel="Search LookUP" onChangeText={setSearch} onSubmitEditing={() => search.trim() && Alert.alert('Search LookUP', `Search preview for “${search.trim()}”`)} placeholder="Search LookUP" placeholderTextColor="#8493A6" returnKeyType="search" style={styles.searchInput} value={search} /></View>
      <View style={styles.headerActions}><Pressable accessibilityLabel="Notifications" onPress={() => Alert.alert('Notifications', 'You are all caught up.')} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}><Icon color="#43546B" name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} size={18} /></Pressable><Pressable accessibilityLabel="Profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable></View>
    </View>

    <View style={styles.greetingBlock}><Text style={styles.greeting}>{greeting}, Kelvin</Text><Text style={styles.greetingCopy}>Here’s what’s happening today.</Text></View>

    <View style={styles.intelligenceCard}>
      <View style={styles.intelligenceHeader}>
        <View style={styles.intelligenceIcon}><Icon color={COLORS.green} name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={21} /></View>
        <View style={styles.intelligenceHeading}><Text style={styles.intelligenceLabel}>LOOKUP DAILY INTELLIGENCE</Text>{intelligenceEnabled ? <><Text style={styles.intelligenceHeadline}>{dailyIntelligence.headline}</Text><Text style={styles.intelligenceSummary}>{dailyIntelligence.summary}</Text></> : null}</View>
        <View style={styles.intelligenceToggle}><Text style={styles.intelligenceToggleLabel}>Smart Mode</Text><Switch accessibilityLabel="Toggle LookUP Intelligence" ios_backgroundColor="#C8D0D9" onValueChange={updateIntelligencePreference} thumbColor="#FFFFFF" trackColor={{ false: '#C8D0D9', true: COLORS.green }} value={intelligenceEnabled} style={styles.intelligenceSwitch} /></View>
      </View>
    </View>

    <View style={[styles.intelligenceDetails, !desktop && styles.intelligenceDetailsMobile]}>
      {intelligenceDetails.map((item) => <View key={item.category} style={styles.intelligenceDetailCard}><View style={styles.intelligenceDetailCopy}><Text style={styles.insightCategory}>{item.category.toUpperCase()}</Text><Text style={styles.insightTitle}>{item.insight?.title ?? item.fallbackTitle}</Text><Text numberOfLines={2} style={styles.insightDetail}>{item.insight?.detail ?? item.fallbackDetail}</Text></View><View style={styles.intelligenceDetailIcon}><Icon color={COLORS.green} name={item.icon} size={20} /></View></View>)}
    </View>

    <View style={[styles.heroGrid, !desktop && styles.stack]}>
      <Pressable onPress={() => router.push('/weather')} style={({ pressed }) => [styles.weatherCard, pressed && styles.cardPressed]}>
        <View style={styles.skyGlow} /><View style={styles.weatherTop}><View><Text style={styles.weatherLabel}>CURRENT WEATHER</Text><Text style={styles.location}>New York, NY</Text></View><View style={styles.weatherIcon}><Icon color="#2587C6" name={ACTIONS[0].icon} size={34} /></View></View>
        <View style={styles.weatherPrimary}>{loading ? <ActivityIndicator color={COLORS.green} size="large" /> : <Text style={styles.temperature}>{temperature}°</Text>}<View><Text style={styles.condition}>{condition}</Text><Text style={styles.feels}>Feels like {feelsLike}°</Text></View></View>
        <View style={styles.weatherMetrics}>{[['Humidity', '58%'], ['Wind', '8 mph'], ['Visibility', '10 mi'], ['UV Index', '4 · Moderate']].map(([label, value]) => <View key={label} style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>)}</View>
      </Pressable>
      <View style={styles.heroSide}>
        <Pressable onPress={() => router.push('/traffic')} style={({ pressed }) => [styles.miniHero, styles.trafficHero, pressed && styles.cardPressed]}><View style={[styles.featureIcon, { backgroundColor: ACTIONS[1].tint }]}><Icon color={ACTIONS[1].color} name={ACTIONS[1].icon} /></View><View style={styles.miniHeroCopy}><Text style={styles.miniLabel}>TRAFFIC TO WORK</Text><Text style={styles.miniValue}>{commute}</Text><Text style={styles.miniMeta}>Light traffic · 2 min faster</Text></View><Text style={styles.arrow}>›</Text></Pressable>
        <Pressable onPress={() => router.push('/finance')} style={({ pressed }) => [styles.miniHero, styles.marketHero, pressed && styles.cardPressed]}><View style={[styles.featureIcon, { backgroundColor: ACTIONS[4].tint }]}><Icon color={ACTIONS[4].color} name={ACTIONS[4].icon} /></View><View style={styles.miniHeroCopy}><Text style={styles.miniLabel}>MARKET SNAPSHOT</Text><Text style={styles.miniValue}>{market}</Text><Text style={styles.miniMeta}>Markets trending higher</Text></View><Text style={styles.arrow}>›</Text></Pressable>
      </View>
    </View>

    <SectionHeader label="EVERYTHING IN ONE PLACE" title="Quick Actions" />
    <ScrollView contentContainerStyle={styles.quickRow} horizontal showsHorizontalScrollIndicator={false}>{ACTIONS.map((action) => <Pressable key={action.label} onPress={() => router.push(action.route)} style={({ pressed }) => [styles.quickCard, pressed && styles.cardPressed]}><View style={[styles.quickIcon, { backgroundColor: action.tint }]}><Icon color={action.color} name={action.icon} size={22} /></View><Text numberOfLines={1} style={styles.quickLabel}>{action.label}</Text></Pressable>)}</ScrollView>

    <View style={[styles.middleGrid, !desktop && styles.stack]}>
      <View style={styles.briefingPanel}><SectionHeader label="PERSONAL SNAPSHOT" title="Today’s Briefing" />{briefing.map((item, index) => <View key={item.title}><Pressable onPress={() => item.route ? router.push(item.route) : item.action?.()} style={({ pressed }) => [styles.briefingRow, pressed && styles.rowPressed]}><View style={[styles.rowIcon, { backgroundColor: item.icon.tint }]}><Icon color={item.icon.color} name={item.icon.icon} size={17} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.rowDescription}>{item.copy}</Text></View><Text style={styles.rowValue}>{item.value}</Text><Text style={styles.chevron}>›</Text></Pressable>{index < briefing.length - 1 ? <View style={styles.divider} /> : null}</View>)}</View>
      <View style={styles.trendingPanel}><SectionHeader action="See all" label="CURATED FOR YOU" title="Trending Now" />{trends.map((trend) => <Pressable key={trend.category} onPress={() => router.push(trend.route)} style={({ pressed }) => [styles.storyCard, pressed && styles.cardPressed]}><View style={[styles.storyArt, { experimental_backgroundImage: `linear-gradient(145deg, ${trend.colors[0]}, ${trend.colors[1]})` }]}><Icon color="#FFFFFF" name={trend.icon} size={28} /></View><View style={styles.storyCopy}><Text style={styles.storyCategory}>{trend.category}</Text><Text numberOfLines={2} style={styles.storyTitle}>{trend.title}</Text><Text style={styles.storyTime}>{trend.time}</Text></View></Pressable>)}</View>
    </View>

    <SectionHeader label="PICK UP WHERE YOU LEFT OFF" title="Continue Listening" />
    <View style={styles.musicPanel}><Pressable onPress={() => router.push('/music')} style={({ pressed }) => [styles.musicMain, pressed && styles.rowPressed]}><View style={styles.albumArt}><View style={styles.albumDisc} /><Text style={styles.albumMark}>LU</Text></View><View style={styles.trackCopy}><Text numberOfLines={1} style={styles.trackName}>{tracks[0] ?? 'Your soundtrack is ready'}</Text><Text style={styles.artist}>{playlist}</Text><View style={styles.progressTrack}><View style={styles.progressFill} /></View></View></Pressable><Pressable accessibilityLabel="Play music" onPress={() => router.push('/music')} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}><Icon color="#FFFFFF" name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={20} /></Pressable><View style={styles.nextUp}><Text style={styles.nextLabel}>NEXT UP</Text><Text numberOfLines={1} style={styles.nextTrack}>{tracks[1] ?? 'Daily discovery mix'}</Text><Text numberOfLines={1} style={styles.nextTrack}>{tracks[2] ?? 'Fresh picks for you'}</Text></View></View>

    <View style={[styles.bottomGrid, !desktop && styles.stack]}>
      <View style={styles.bottomPanel}><SectionHeader action="See all" label="TONIGHT" title="Upcoming Games" />{(games.length ? games.slice(0, 2) : ['Knicks vs Celtics', 'Yankees vs Red Sox']).map((game, index) => <Pressable key={`${game}-${index}`} onPress={() => router.push('/sports')} style={({ pressed }) => [styles.gameRow, pressed && styles.rowPressed]}><View style={styles.teamBadge}><Text style={styles.teamBadgeText}>{index ? 'NYY' : 'NYK'}</Text></View><View style={styles.gameCopy}><Text numberOfLines={1} style={styles.gameTitle}>{game}</Text><Text style={styles.gameTime}>{index ? 'Tomorrow · 1:05 PM' : 'Tonight · 7:30 PM'}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}</View>
      <View style={styles.bottomPanel}><SectionHeader label="SCHEDULE" title="Your Day" />{[['Weather', `${temperature}° · ${condition}`], ['Leave for work', '8:14 AM'], ['Market open', '9:30 AM'], ['Game', '7:30 PM'], ['New music', '9:00 PM']].map(([title, value], index) => <View key={title} style={styles.timelineRow}><View style={styles.timelineRail}><View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />{index < 4 ? <View style={styles.timelineLine} /> : null}</View><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.timelineValue}>{value}</Text></View>)}</View>
      <View style={styles.bottomPanel}><SectionHeader label="LIVE PREVIEW" title="Market Movers" />{MARKET_MOVERS.map((stock) => <Pressable key={stock.symbol} onPress={() => router.push('/finance')} style={({ pressed }) => [styles.stockRow, pressed && styles.rowPressed]}><View><Text style={styles.stockSymbol}>{stock.symbol}</Text><Text style={styles.stockCompany}>{stock.company}</Text></View><Text style={[styles.stockMove, !stock.up && styles.stockDown]}>{stock.value}</Text></Pressable>)}</View>
    </View>
    </ScrollView>
  </View>;
}

const cardShadow = { shadowColor: '#465C76', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 2 } as const;

const styles = StyleSheet.create({
  screen: { backgroundColor: '#A4B6C9', experimental_backgroundImage: 'linear-gradient(180deg, #AEBFD1 0%, #A4B6C9 50%, #99ADBF 100%)', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 0 },
  scrollLayer: { backgroundColor: 'transparent', elevation: 2, flex: 1, zIndex: 2 },
  content: { alignSelf: 'center', maxWidth: 1220, width: '100%' },
  backgroundBranding: { alignItems: 'center', elevation: 1, height: 430, justifyContent: 'center', left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 86, zIndex: 1 },
  backgroundBrandingMobile: { height: 300, top: 126 },
  backgroundWordmark: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'center' },
  backgroundWordmarkDesktop: { width: 600 },
  backgroundWordmarkTablet: { width: 460 },
  backgroundWordmarkMobile: { width: 290 },
  backgroundLook: { color: 'rgba(100, 123, 150, 0.11)', fontWeight: '900' },
  backgroundUp: { color: 'rgba(63, 127, 78, 0.26)', fontWeight: '900' },
  backgroundTextDesktop: { fontSize: 168, letterSpacing: -11 },
  backgroundTextTablet: { fontSize: 128, letterSpacing: -8.5 },
  backgroundTextMobile: { fontSize: 81, letterSpacing: -5.25 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 22, marginBottom: 36 },
  topBarMobile: { flexWrap: 'wrap', gap: 12 },
  wordmark: { alignItems: 'baseline', flexDirection: 'row', minWidth: 126 },
  wordmarkLook: { color: COLORS.ink, fontSize: 28, fontWeight: '900', letterSpacing: -1.5 },
  wordmarkUp: { color: COLORS.green, fontSize: 28, fontWeight: '900', letterSpacing: -1.5 },
  searchBar: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderColor: '#D9E6F0', borderRadius: 24, borderWidth: 1, flex: 1, flexDirection: 'row', height: 48, maxWidth: 610, paddingHorizontal: 17, ...cardShadow },
  searchBarMobile: { flexBasis: '100%', maxWidth: '100%', width: '100%' },
  searchInput: { color: COLORS.ink, flex: 1, fontSize: 14, paddingHorizontal: 11, paddingVertical: 0 },
  headerActions: { flexDirection: 'row', gap: 10, marginLeft: 'auto' },
  circleButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D9E6F0', borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  profileButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderColor: '#FFFFFF', borderRadius: 23, borderWidth: 2, height: 46, justifyContent: 'center', width: 46 },
  profileText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  greetingBlock: { marginBottom: 26 },
  greeting: { color: COLORS.ink, fontSize: 36, fontWeight: '900', letterSpacing: -1.1 },
  greetingCopy: { color: COLORS.muted, fontSize: 15, marginTop: 7 },
  intelligenceCard: { backgroundColor: 'rgba(227,233,240,0.94)', borderColor: 'rgba(70,92,118,0.12)', borderRadius: 22, borderWidth: 1, marginBottom: 12, paddingHorizontal: 20, paddingVertical: 16, ...cardShadow },
  intelligenceHeader: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  intelligenceIcon: { alignItems: 'center', backgroundColor: '#DDF3E8', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  intelligenceHeading: { flex: 1 },
  intelligenceLabel: { color: COLORS.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  intelligenceHeadline: { color: COLORS.ink, fontSize: 17, fontWeight: '800', lineHeight: 23, marginTop: 4 },
  intelligenceSummary: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  intelligenceToggle: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7, marginLeft: 14 },
  intelligenceToggleLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '700' },
  intelligenceSwitch: { transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] },
  intelligenceDetails: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  intelligenceDetailsMobile: { flexDirection: 'column' },
  intelligenceDetailCard: { alignItems: 'center', backgroundColor: 'rgba(231,236,242,0.94)', borderColor: 'rgba(70,92,118,0.12)', borderRadius: 18, borderWidth: 1, flex: 1, flexDirection: 'row', minHeight: 104, padding: 16, ...cardShadow },
  intelligenceDetailCopy: { flex: 1, paddingRight: 12 },
  intelligenceDetailIcon: { alignItems: 'center', backgroundColor: '#DDF3E8', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  insightCategory: { color: COLORS.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  insightTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginTop: 5 },
  insightDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  heroGrid: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  stack: { flexDirection: 'column' },
  weatherCard: { backgroundColor: '#E2F4FF', borderColor: '#C8E4F3', borderRadius: 24, borderWidth: 1, flex: 1.5, minHeight: 330, overflow: 'hidden', padding: 26, ...cardShadow },
  skyGlow: { backgroundColor: '#FFFFFF', borderRadius: 210, height: 420, opacity: 0.52, position: 'absolute', right: -160, top: -220, width: 420 },
  weatherTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  weatherLabel: { color: '#4381A7', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  location: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginTop: 7 },
  weatherIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 24, height: 54, justifyContent: 'center', width: 54 },
  weatherPrimary: { alignItems: 'flex-end', flexDirection: 'row', gap: 18, marginTop: 26 },
  temperature: { color: COLORS.ink, fontSize: 70, fontWeight: '900', letterSpacing: -3 },
  condition: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginBottom: 7 },
  feels: { color: COLORS.muted, fontSize: 11, marginBottom: 11 },
  weatherMetrics: { backgroundColor: 'rgba(255,255,255,0.58)', borderRadius: 17, flexDirection: 'row', marginTop: 25, padding: 15 },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#77899C', fontSize: 8, fontWeight: '700' },
  metricValue: { color: COLORS.ink, fontSize: 11, fontWeight: '900', marginTop: 5 },
  heroSide: { flex: 1, gap: 20 },
  miniHero: { alignItems: 'center', backgroundColor: COLORS.surface, borderColor: COLORS.line, borderRadius: 22, borderWidth: 1, flex: 1, flexDirection: 'row', minHeight: 155, padding: 21, ...cardShadow },
  trafficHero: { backgroundColor: 'rgba(227, 233, 240, 0.92)', borderColor: 'rgba(70, 92, 118, 0.12)' },
  marketHero: { backgroundColor: 'rgba(220, 228, 236, 0.92)', borderColor: 'rgba(70, 92, 118, 0.12)' },
  featureIcon: { alignItems: 'center', borderRadius: 18, height: 48, justifyContent: 'center', width: 48 },
  miniHeroCopy: { flex: 1, marginLeft: 15 },
  miniLabel: { color: '#79889A', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  miniValue: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 8 },
  miniMeta: { color: COLORS.muted, fontSize: 10, marginTop: 5 },
  arrow: { color: '#91A0B0', fontSize: 24 },
  sectionHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17, marginTop: 4 },
  sectionLabel: { color: COLORS.green, fontSize: 8, fontWeight: '900', letterSpacing: 1.25, marginBottom: 5 },
  sectionTitle: { color: COLORS.ink, fontSize: 23, fontWeight: '900', letterSpacing: -0.5 },
  sectionAction: { color: COLORS.green, fontSize: 11, fontWeight: '900', marginBottom: 3 },
  quickRow: { gap: 12, paddingBottom: 39, paddingRight: 24 },
  quickCard: { alignItems: 'center', backgroundColor: 'rgba(231, 236, 242, 0.94)', borderColor: 'rgba(70, 92, 118, 0.12)', borderRadius: 20, borderWidth: 1, height: 104, justifyContent: 'center', width: 132, ...cardShadow },
  quickIcon: { alignItems: 'center', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  quickLabel: { color: COLORS.ink, fontSize: 11, fontWeight: '800', marginTop: 11, maxWidth: 116 },
  middleGrid: { alignItems: 'stretch', flexDirection: 'row', gap: 20, marginBottom: 39 },
  briefingPanel: { backgroundColor: 'rgba(227, 233, 240, 0.92)', borderColor: 'rgba(70, 92, 118, 0.12)', borderRadius: 24, borderWidth: 1, flex: 1.14, padding: 22, ...cardShadow },
  trendingPanel: { backgroundColor: 'rgba(220, 228, 236, 0.92)', borderColor: 'rgba(70, 92, 118, 0.12)', borderRadius: 24, borderWidth: 1, flex: 0.86, padding: 22, ...cardShadow },
  briefingRow: { alignItems: 'center', flexDirection: 'row', minHeight: 63, paddingVertical: 8 },
  rowIcon: { alignItems: 'center', borderRadius: 13, height: 38, justifyContent: 'center', marginRight: 12, width: 38 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
  rowDescription: { color: COLORS.muted, fontSize: 9.5, marginTop: 4 },
  rowValue: { color: '#52657A', fontSize: 9.5, fontWeight: '800', marginLeft: 10 },
  chevron: { color: '#9AA9B9', fontSize: 19, marginLeft: 9 },
  divider: { backgroundColor: '#E8EFF5', height: StyleSheet.hairlineWidth, marginLeft: 50 },
  storyCard: { alignItems: 'center', flexDirection: 'row', marginBottom: 14, minHeight: 96 },
  storyArt: { alignItems: 'center', borderRadius: 17, height: 86, justifyContent: 'center', overflow: 'hidden', width: 112 },
  storyCopy: { flex: 1, marginLeft: 13 },
  storyCategory: { color: COLORS.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  storyTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '900', lineHeight: 17, marginTop: 5 },
  storyTime: { color: '#8997A7', fontSize: 9, marginTop: 7 },
  musicPanel: { alignItems: 'center', backgroundColor: 'rgba(227, 233, 240, 0.92)', borderColor: 'rgba(70, 92, 118, 0.12)', borderRadius: 24, borderWidth: 1, flexDirection: 'row', marginBottom: 39, minHeight: 122, padding: 17, ...cardShadow },
  musicMain: { alignItems: 'center', flex: 1.2, flexDirection: 'row', minWidth: 0 },
  albumArt: { alignItems: 'center', backgroundColor: '#D7C4F0', borderRadius: 18, height: 76, justifyContent: 'center', overflow: 'hidden', width: 76 },
  albumDisc: { backgroundColor: '#8D66BC', borderRadius: 48, height: 96, opacity: 0.7, position: 'absolute', right: -34, top: -30, width: 96 },
  albumMark: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  trackCopy: { flex: 1, marginHorizontal: 16, minWidth: 0 },
  trackName: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  artist: { color: COLORS.muted, fontSize: 10, marginTop: 5 },
  progressTrack: { backgroundColor: '#E5EAF0', borderRadius: 2, height: 3, marginTop: 14, overflow: 'hidden' },
  progressFill: { backgroundColor: COLORS.green, borderRadius: 2, height: 3, width: '43%' },
  playButton: { alignItems: 'center', backgroundColor: COLORS.green, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  nextUp: { borderLeftColor: '#E4ECF3', borderLeftWidth: 1, flex: 0.72, gap: 5, marginLeft: 22, paddingLeft: 22 },
  nextLabel: { color: COLORS.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  nextTrack: { color: '#506075', fontSize: 10, fontWeight: '700' },
  bottomGrid: { alignItems: 'stretch', flexDirection: 'row', gap: 18, marginBottom: 14 },
  bottomPanel: { backgroundColor: 'rgba(220, 228, 236, 0.92)', borderColor: 'rgba(70, 92, 118, 0.12)', borderRadius: 22, borderWidth: 1, flex: 1, minHeight: 267, padding: 20, ...cardShadow },
  gameRow: { alignItems: 'center', backgroundColor: '#D4DEE8', borderRadius: 15, flexDirection: 'row', marginBottom: 10, minHeight: 73, padding: 11 },
  teamBadge: { alignItems: 'center', backgroundColor: '#E8F1FB', borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  teamBadgeText: { color: '#3D69A2', fontSize: 9, fontWeight: '900' },
  gameCopy: { flex: 1, marginLeft: 11, minWidth: 0 },
  gameTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '900' },
  gameTime: { color: COLORS.muted, fontSize: 9, marginTop: 5 },
  timelineRow: { alignItems: 'flex-start', flexDirection: 'row', minHeight: 36 },
  timelineRail: { alignItems: 'center', alignSelf: 'stretch', width: 18 },
  timelineDot: { backgroundColor: '#C9D5DF', borderRadius: 4, height: 7, marginTop: 4, width: 7 },
  timelineDotActive: { backgroundColor: COLORS.green },
  timelineLine: { backgroundColor: '#DDE7EF', flex: 1, marginVertical: 3, width: 1 },
  timelineTitle: { color: COLORS.ink, flex: 1, fontSize: 10, fontWeight: '800', marginLeft: 7 },
  timelineValue: { color: COLORS.muted, fontSize: 9 },
  stockRow: { alignItems: 'center', borderBottomColor: '#E8EFF5', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 57 },
  stockSymbol: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
  stockCompany: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  stockMove: { color: COLORS.green, fontSize: 13, fontWeight: '900' },
  stockDown: { color: '#D85A59' },
  pressed: { opacity: 0.68 },
  rowPressed: { backgroundColor: '#F1F7FA' },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
