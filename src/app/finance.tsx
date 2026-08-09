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

import {
  getMarketData,
  MOCK_FINANCE_ASSETS,
  MOCK_FINANCE_INDEXES,
  searchFinanceAssets,
  type FinanceAsset,
  type FinanceDataProvenance,
  type FinanceMarketIndex,
} from '@/services/finance';

type Period = '1D' | '1W' | '1M' | '3M' | '1Y';
type MarketStatus = 'Pre-Market' | 'Market Open' | 'After Hours' | 'Market Closed' | 'Holiday' | 'Early Close';
type MarketException = { type: 'holiday' | 'early-close'; label: string };

type NewsStory = {
  id: string;
  headline: string;
  source: string;
  time: string;
  category: string;
  colors: [string, string];
};

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y'];

const MARKET_EXCEPTIONS: Record<string, MarketException> = {
  '2026-01-01': { type: 'holiday', label: "New Year's Day" },
  '2026-07-03': { type: 'holiday', label: 'Independence Day observed' },
  '2026-11-27': { type: 'early-close', label: 'Locally configured early close' },
  '2026-12-25': { type: 'holiday', label: 'Christmas Day' },
  '2027-01-01': { type: 'holiday', label: "New Year's Day" },
  '2027-11-26': { type: 'early-close', label: 'Locally configured early close' },
  '2027-12-24': { type: 'holiday', label: 'Christmas Day observed' },
};

const ET_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function getEasternParts(date: Date) {
  const parts = Object.fromEntries(ET_FORMATTER.formatToParts(date).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), weekday: parts.weekday };
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function easternDateToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const easternAtGuess = getEasternParts(new Date(guess));
  const representedAsUtc = Date.UTC(easternAtGuess.year, easternAtGuess.month - 1, easternAtGuess.day, easternAtGuess.hour, easternAtGuess.minute);
  return new Date(guess - (representedAsUtc - guess));
}

function shiftDate(year: number, month: number, day: number, days: number) {
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate(), weekday: shifted.getUTCDay() };
}

function isTradingDay(year: number, month: number, day: number) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday !== 0 && weekday !== 6 && MARKET_EXCEPTIONS[dateKey(year, month, day)]?.type !== 'holiday';
}

function nextTradingDate(year: number, month: number, day: number, includeToday = false) {
  for (let offset = includeToday ? 0 : 1; offset < 10; offset += 1) {
    const candidate = shiftDate(year, month, day, offset);
    if (isTradingDay(candidate.year, candidate.month, candidate.day)) return candidate;
  }
  return shiftDate(year, month, day, 1);
}

function formatCountdown(target: Date, now: Date) {
  const totalMinutes = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [days ? `${days} day${days === 1 ? '' : 's'}` : '', hours ? `${hours} hr` : '', `${minutes} min`].filter(Boolean).join(' ');
}

function formatEasternTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(date) + ' ET';
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(date) + ' ET';
}

const CHART_DATA: Record<Period, number[]> = {
  '1D': [32, 34, 31, 38, 42, 40, 47, 45, 52, 57, 54, 61, 59, 66],
  '1W': [46, 43, 48, 51, 49, 56, 60, 58, 64, 62, 68, 71, 69, 75],
  '1M': [40, 44, 42, 47, 53, 50, 58, 63, 60, 67, 72, 70, 77, 82],
  '3M': [58, 54, 49, 52, 57, 61, 65, 63, 68, 73, 76, 80, 78, 85],
  '1Y': [28, 33, 30, 39, 43, 48, 45, 55, 59, 64, 70, 74, 81, 88],
};

const NEWS: NewsStory[] = [
  { id: 'rates', headline: 'Markets weigh the latest signals on interest rates', source: 'Market Brief', time: '14m ago', category: 'Economy', colors: ['#234B58', '#64A7A2'] },
  { id: 'chips', headline: 'Chipmakers lead as technology shares regain momentum', source: 'Closing Bell', time: '38m ago', category: 'Technology', colors: ['#344170', '#7588D0'] },
  { id: 'retail', headline: 'Retail earnings offer a fresh look at consumer demand', source: 'Business Daily', time: '1h ago', category: 'Companies', colors: ['#68452C', '#D49A52'] },
  { id: 'energy', headline: 'Energy markets settle after a volatile trading session', source: 'Global Markets', time: '2h ago', category: 'Commodities', colors: ['#31543D', '#73AE72'] },
];

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const chartWidth = Math.max(250, Math.min(width - (isDesktop ? 132 : 80), 980));
  const [query, setQuery] = useState('');
  const [portfolioPeriod, setPortfolioPeriod] = useState<Period>('1M');
  const [assetPeriod, setAssetPeriod] = useState<Period>('1D');
  const [assets, setAssets] = useState<FinanceAsset[]>(MOCK_FINANCE_ASSETS);
  const [indexes, setIndexes] = useState<FinanceMarketIndex[]>(MOCK_FINANCE_INDEXES);
  const [financeProvenance, setFinanceProvenance] = useState<FinanceDataProvenance>('unavailable');
  const [selectedAsset, setSelectedAsset] = useState<FinanceAsset>(MOCK_FINANCE_ASSETS[0]);
  const [favorites, setFavorites] = useState<string[]>(['aapl', 'nvda']);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinance = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getMarketData();
    setFinanceProvenance(result.provenance);
    if (result.provenance === 'unavailable') setError(result.error);
    else {
      setAssets(result.data.assets);
      setIndexes(result.data.indexes);
      setSelectedAsset((current) => result.data.assets.find((asset) => asset.id === current.id) ?? result.data.assets[0] ?? current);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadFinance();
  }, []);

  const watchlist = useMemo(() => assets.filter((asset) => asset.assetType === 'Stock').slice(0, 5), [assets]);
  const crypto = useMemo(() => assets.filter((asset) => asset.assetType === 'Crypto'), [assets]);

  const searchResults = useMemo(() => {
    return searchFinanceAssets(assets, query);
  }, [assets, query]);

  const toggle = (id: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (isLoading) return <ScreenState loading title="Loading your money hub" copy="Preparing simulated market data…" />;
  if (error) return <ScreenState title="Finance is unavailable" copy={error} action="Try again" onAction={() => { void loadFinance(); }} />;

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: isDesktop ? 32 : 20, paddingBottom: insets.bottom + 140 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>YOUR MONEY HUB</Text><Text style={styles.title}>Finance</Text><Text style={styles.subtitle}>Markets and money at a glance.</Text></View>
        <View style={styles.headerActions}><Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable><Pressable accessibilityLabel="Finance notifications" onPress={() => Alert.alert('Notifications', 'Finance alerts are coming soon.')} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}><Text style={styles.settingsIcon}>●</Text></Pressable></View>
      </View>

      <MarketHoursCard isDesktop={isDesktop} />

      {financeProvenance === 'mock' ? <Text style={styles.simulatedDataLabel}>SIMULATED MARKET DATA</Text> : null}

      <View style={styles.searchBar}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Search stocks, ETFs, crypto" autoCapitalize="characters" autoCorrect={false} onChangeText={setQuery} placeholder="Search stocks, ETFs, crypto" placeholderTextColor="#7E8793" returnKeyType="search" style={styles.searchInput} value={query} />{query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><Text style={styles.clearIcon}>×</Text></Pressable>}</View>

      {query.trim() ? (
        <SearchResults results={searchResults} query={query.trim()} onSelect={(asset) => { setSelectedAsset(asset); setQuery(''); }} />
      ) : (
        <>
          <PortfolioCard period={portfolioPeriod} onPeriod={setPortfolioPeriod} chartWidth={chartWidth} />

          <View style={styles.section}><SectionHeader title="Market Indexes" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{indexes.map((index) => <IndexCard key={index.id} index={index} />)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Watchlist" /><View style={styles.listCard}>{watchlist.map((asset, index) => <View key={asset.id}><WatchlistRow asset={asset} favorite={favorites.includes(asset.id)} onSelect={() => setSelectedAsset(asset)} onFavorite={() => toggle(asset.id, setFavorites)} />{index < watchlist.length - 1 && <View style={styles.divider} />}</View>)}</View></View>

          <View style={styles.section}><SectionHeader title="Asset Snapshot" /><AssetDetail asset={selectedAsset} period={assetPeriod} onPeriod={setAssetPeriod} chartWidth={chartWidth} /></View>

          <View style={styles.section}><SectionHeader title="Crypto" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{crypto.map((asset) => <CryptoCard key={asset.id} asset={asset} onPress={() => setSelectedAsset(asset)} />)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Market News" /><View style={styles.newsCard}>{NEWS.map((story, index) => <View key={story.id}><NewsRow story={story} saved={bookmarks.includes(story.id)} onBookmark={() => toggle(story.id, setBookmarks)} />{index < NEWS.length - 1 && <View style={styles.newsDivider} />}</View>)}</View></View>

          <View style={styles.sectionLast}><SectionHeader title="Spending Snapshot" /><SpendingCard /></View>

          <Text style={styles.disclaimer}>Market and portfolio information shown in this MVP is simulated and is not financial advice.</Text>
        </>
      )}
    </ScrollView>
  );
}

function MarketHoursCard({ isDesktop }: { isDesktop: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const market = useMemo(() => {
    const eastern = getEasternParts(now);
    const key = dateKey(eastern.year, eastern.month, eastern.day);
    const exception = MARKET_EXCEPTIONS[key];
    const minutes = eastern.hour * 60 + eastern.minute;
    const weekend = eastern.weekday === 'Sat' || eastern.weekday === 'Sun';
    const earlyClose = exception?.type === 'early-close';
    const closeMinutes = earlyClose ? 13 * 60 : 16 * 60;
    let status: MarketStatus = 'Market Closed';
    let activeSession: 'pre' | 'regular' | 'after' | null = null;
    let countdownLabel = '';
    let countdownTarget: Date;

    if (exception?.type === 'holiday') {
      status = 'Holiday';
      const next = nextTradingDate(eastern.year, eastern.month, eastern.day);
      countdownTarget = easternDateToUtc(next.year, next.month, next.day, 9, 30);
      countdownLabel = `Next session opens ${formatEventDate(countdownTarget)}`;
    } else if (weekend) {
      const next = nextTradingDate(eastern.year, eastern.month, eastern.day);
      countdownTarget = easternDateToUtc(next.year, next.month, next.day, 9, 30);
      countdownLabel = `Next session opens ${formatEventDate(countdownTarget)}`;
    } else if (minutes < 4 * 60) {
      countdownTarget = easternDateToUtc(eastern.year, eastern.month, eastern.day, 4, 0);
      countdownLabel = `Pre-market starts in ${formatCountdown(countdownTarget, now)}`;
    } else if (minutes < 9 * 60 + 30) {
      status = 'Pre-Market'; activeSession = 'pre';
      countdownTarget = easternDateToUtc(eastern.year, eastern.month, eastern.day, 9, 30);
      countdownLabel = `Market opens in ${formatCountdown(countdownTarget, now)}`;
    } else if (minutes < closeMinutes) {
      status = earlyClose ? 'Early Close' : 'Market Open'; activeSession = 'regular';
      countdownTarget = easternDateToUtc(eastern.year, eastern.month, eastern.day, earlyClose ? 13 : 16, 0);
      countdownLabel = `Market closes in ${formatCountdown(countdownTarget, now)}`;
    } else if (minutes < 20 * 60) {
      status = earlyClose ? 'Early Close' : 'After Hours'; activeSession = 'after';
      countdownTarget = easternDateToUtc(eastern.year, eastern.month, eastern.day, 20, 0);
      countdownLabel = `After hours ends in ${formatCountdown(countdownTarget, now)}`;
    } else {
      const next = nextTradingDate(eastern.year, eastern.month, eastern.day);
      countdownTarget = easternDateToUtc(next.year, next.month, next.day, 9, 30);
      countdownLabel = `Next session opens ${formatEventDate(countdownTarget)}`;
    }

    const todayTradingDay = isTradingDay(eastern.year, eastern.month, eastern.day);
    const nextOpenDate = todayTradingDay && minutes < 9 * 60 + 30
      ? { year: eastern.year, month: eastern.month, day: eastern.day }
      : nextTradingDate(eastern.year, eastern.month, eastern.day);
    const nextCloseDate = todayTradingDay && minutes < closeMinutes
      ? { year: eastern.year, month: eastern.month, day: eastern.day }
      : nextTradingDate(eastern.year, eastern.month, eastern.day);
    const nextCloseException = MARKET_EXCEPTIONS[dateKey(nextCloseDate.year, nextCloseDate.month, nextCloseDate.day)];
    const nextCloseHour = nextCloseException?.type === 'early-close' ? 13 : 16;

    return {
      status, activeSession, countdownLabel, exception,
      currentTime: formatEasternTime(now),
      todayHours: exception?.type === 'holiday' || weekend ? 'Closed' : `9:30 AM-${earlyClose ? '1:00 PM' : '4:00 PM'} ET`,
      nextOpen: formatEventDate(easternDateToUtc(nextOpenDate.year, nextOpenDate.month, nextOpenDate.day, 9, 30)),
      nextClose: formatEventDate(easternDateToUtc(nextCloseDate.year, nextCloseDate.month, nextCloseDate.day, nextCloseHour, 0)),
      calendarType: exception?.type === 'holiday' ? 'Holiday' : earlyClose ? 'Early Close' : 'Full Trading Day',
    };
  }, [now]);

  const statusStyle = market.status === 'Market Open' ? styles.statusOpen
    : market.status === 'Pre-Market' ? styles.statusPre
      : market.status === 'After Hours' ? styles.statusAfter
        : market.status === 'Early Close' ? styles.statusEarly : styles.statusClosed;

  const sessions = [
    { id: 'pre', title: 'Pre-Market', time: '4:00 AM-9:30 AM ET' },
    { id: 'regular', title: 'Regular Market', time: '9:30 AM-4:00 PM ET' },
    { id: 'after', title: 'After Hours', time: '4:00 PM-8:00 PM ET' },
  ] as const;

  return <View style={styles.marketHoursCard}>
    <View style={[styles.marketHoursGrid, !isDesktop && styles.marketHoursGridMobile]}>
      <View style={styles.marketSummary}>
        <View style={styles.marketHoursHeading}><Text style={styles.marketHoursEyebrow}>U.S. MARKET HOURS</Text><Text style={styles.localBadge}>LOCAL ET LOGIC</Text></View>
        <View style={styles.statusLine}><View style={[styles.marketStatusBadge, statusStyle]}><View style={styles.marketStatusDot} /><Text style={styles.marketStatusText}>{market.status}</Text></View><Text style={styles.currentEt}>{market.currentTime}</Text></View>
        <Text style={styles.countdown}>{market.countdownLabel}</Text>
        <View style={styles.regularHours}><View><Text style={styles.marketMetaLabel}>TODAY'S OPEN</Text><Text style={styles.marketMetaValue}>{market.todayHours === 'Closed' ? 'Closed' : '9:30 AM ET'}</Text></View><View><Text style={styles.marketMetaLabel}>TODAY'S CLOSE</Text><Text style={styles.marketMetaValue}>{market.todayHours === 'Closed' ? 'Closed' : market.todayHours.split('-')[1]}</Text></View></View>
      </View>
      <View style={styles.sessionsPanel}><Text style={styles.marketPanelTitle}>Trading Sessions</Text><View style={[styles.sessionRows, !isDesktop && styles.sessionRowsMobile]}>{sessions.map((session) => <View key={session.id} style={[styles.sessionChip, market.activeSession === session.id && styles.sessionChipActive]}><Text style={[styles.sessionTitle, market.activeSession === session.id && styles.sessionTitleActive]}>{session.title}</Text><Text style={[styles.sessionTime, market.activeSession === session.id && styles.sessionTimeActive]}>{session.time}</Text></View>)}</View></View>
    </View>
    <View style={styles.marketCalendar}>
      <View style={styles.calendarHeading}><Text style={styles.marketPanelTitle}>Market Calendar</Text><Text style={styles.configuredBadge}>LOCALLY CONFIGURED / SIMULATED</Text></View>
      <View style={[styles.calendarGrid, !isDesktop && styles.calendarGridMobile]}><CalendarDatum label="TODAY'S SESSION" value={market.todayHours} /><CalendarDatum label="NEXT MARKET OPEN" value={market.nextOpen} /><CalendarDatum label="NEXT MARKET CLOSE" value={market.nextClose} /><CalendarDatum label="CALENDAR" value={market.exception?.label ?? market.calendarType} accent={market.calendarType === 'Early Close'} /></View>
    </View>
    <Text style={styles.marketHoursNote}>Market hours are shown in Eastern Time. Holiday schedules and individual securities may vary.</Text>
  </View>;
}

function CalendarDatum({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.calendarDatum}><Text style={styles.calendarLabel}>{label}</Text><Text numberOfLines={2} style={[styles.calendarValue, accent && styles.calendarValueAccent]}>{value}</Text></View>;
}

function PeriodSelector({ value, onChange }: { value: Period; onChange: (period: Period) => void }) {
  return <View style={styles.periodRow}>{PERIODS.map((period) => <Pressable key={period} onPress={() => onChange(period)} style={({ pressed }) => [styles.periodButton, value === period && styles.periodButtonActive, pressed && styles.pressed]}><Text style={[styles.periodText, value === period && styles.periodTextActive]}>{period}</Text></Pressable>)}</View>;
}

function ViewLineChart({ data, width, height = 126, positive = true }: { data: number[]; width: number; height?: number; positive?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const step = width / (data.length - 1);
  const points = data.map((value, index) => ({ x: index * step, y: height - 12 - ((value - min) / Math.max(max - min, 1)) * (height - 28) }));
  return (
    <View style={[styles.chart, { width, height }]}>
      {[0.25, 0.5, 0.75].map((line) => <View key={line} style={[styles.chartGrid, { top: height * line }]} />)}
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = `${Math.atan2(dy, dx) * 180 / Math.PI}deg`;
        return <View key={index} style={[styles.chartSegment, !positive && styles.chartSegmentNegative, { left: point.x, top: point.y, width: length, transform: [{ translateX: -length / 2 }, { rotate: angle }, { translateX: length / 2 }] }]} />;
      })}
      {points.map((point, index) => <View key={`dot-${index}`} style={[styles.chartDot, !positive && styles.chartDotNegative, { left: point.x - 3, top: point.y - 3 }]} />)}
    </View>
  );
}

function PortfolioCard({ period, onPeriod, chartWidth }: { period: Period; onPeriod: (period: Period) => void; chartWidth: number }) {
  return <View style={styles.portfolioCard}><View style={styles.portfolioTop}><View><Text style={styles.overline}>TOTAL BALANCE · SIMULATED</Text><Text style={styles.balance}>$48,392.16</Text><Text style={styles.gainText}>+$612.84  (+1.28%) today</Text></View><Text style={styles.portfolioMark}>LU</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false}><ViewLineChart data={CHART_DATA[period]} width={chartWidth} /></ScrollView><PeriodSelector value={period} onChange={onPeriod} /></View>;
}

function SectionHeader({ title }: { title: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={() => Alert.alert(title, 'The full view is coming soon.')} hitSlop={8}><Text style={styles.seeAll}>See all</Text></Pressable></View>;
}

function MiniTrend({ values, positive }: { values: number[]; positive: boolean }) {
  const max = Math.max(...values);
  return <View style={styles.miniTrend}>{values.map((value, index) => <View key={index} style={[styles.miniBar, !positive && styles.miniBarNegative, { height: 5 + (value / max) * 24 }]} />)}</View>;
}

function IndexCard({ index }: { index: FinanceMarketIndex }) {
  const positive = index.dailyChangePercent >= 0;
  return <View style={styles.indexCard}><Text style={styles.indexName}>{index.name}</Text><Text style={styles.indexValue}>{index.displayValue}</Text><View style={styles.indexBottom}><View><Text style={[styles.marketChange, !positive && styles.negative]}>{index.dailyChangeDisplay}</Text><Text style={[styles.marketPercent, !positive && styles.negative]}>{positive ? '+' : ''}{index.dailyChangePercent.toFixed(2)}%</Text></View><MiniTrend values={index.trend} positive={positive} /></View></View>;
}

function AssetLogo({ asset, size = 42 }: { asset: FinanceAsset; size?: number }) {
  return <View style={[styles.assetLogo, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.colors[0], borderColor: asset.colors[1] }]}><Text style={[styles.assetLogoText, { fontSize: size * 0.25 }]}>{asset.symbol.slice(0, 3)}</Text></View>;
}

function WatchlistRow({ asset, favorite, onSelect, onFavorite }: { asset: FinanceAsset; favorite: boolean; onSelect: () => void; onFavorite: () => void }) {
  const positive = asset.dailyChangePercent >= 0;
  return <View style={styles.watchRow}><Pressable onPress={onSelect} style={({ pressed }) => [styles.watchMain, pressed && styles.cardPressed]}><AssetLogo asset={asset} /><View style={styles.watchName}><Text style={styles.assetName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.symbol} · {asset.assetType}</Text></View><MiniTrend values={positive ? [4, 6, 5, 8, 7, 10] : [10, 8, 9, 6, 7, 4]} positive={positive} /><View style={styles.watchPrice}><Text style={styles.priceText}>{asset.displayValue}</Text><Text style={[styles.changeText, !positive && styles.negative]}>{positive ? '+' : ''}{asset.dailyChangePercent.toFixed(2)}%</Text></View></Pressable><Pressable accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${asset.name} favorite`} onPress={onFavorite} style={({ pressed }) => [styles.starButton, favorite && styles.starActive, pressed && styles.pressed]}><Text style={[styles.starText, favorite && styles.starTextActive]}>★</Text></Pressable></View>;
}

function AssetDetail({ asset, period, onPeriod, chartWidth }: { asset: FinanceAsset; period: Period; onPeriod: (period: Period) => void; chartWidth: number }) {
  const positive = asset.dailyChangePercent >= 0;
  const data = positive ? CHART_DATA[period] : [...CHART_DATA[period]].reverse();
  return <View style={styles.assetCard}><View style={styles.assetHeader}><View style={styles.assetIdentity}><AssetLogo asset={asset} size={50} /><View><Text style={styles.assetDetailName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.symbol} · {asset.assetType}</Text></View></View><View><Text style={styles.assetDetailPrice}>{asset.displayValue}</Text><Text style={[styles.assetDetailChange, !positive && styles.negative]}>{positive ? '+' : ''}{asset.dailyChangePercent.toFixed(2)}% today</Text></View></View><ScrollView horizontal showsHorizontalScrollIndicator={false}><ViewLineChart data={data} width={chartWidth} positive={positive} height={112} /></ScrollView><PeriodSelector value={period} onChange={onPeriod} /><View style={styles.assetStats}><View><Text style={styles.statLabel}>MARKET CAP</Text><Text style={styles.statValue}>{asset.marketCap}</Text></View><View><Text style={styles.statLabel}>52-WEEK RANGE</Text><Text style={styles.statValue}>{asset.range}</Text></View></View><Text style={styles.assetDescription}>{asset.description}</Text><Pressable onPress={() => Alert.alert(asset.name, 'A full asset details experience is coming soon.')} style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}><Text style={styles.detailsText}>View details</Text></Pressable></View>;
}

function CryptoCard({ asset, onPress }: { asset: FinanceAsset; onPress: () => void }) {
  const positive = asset.dailyChangePercent >= 0;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.cryptoCard, pressed && styles.cardPressed]}><View style={styles.cryptoTop}><AssetLogo asset={asset} /><Text style={[styles.trendArrow, !positive && styles.negative]}>{positive ? '↗' : '↘'}</Text></View><Text style={styles.cryptoName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.symbol}</Text><Text style={styles.cryptoPrice}>{asset.displayValue}</Text><Text style={[styles.changeText, !positive && styles.negative]}>{positive ? '+' : ''}{asset.dailyChangePercent.toFixed(2)}%</Text></Pressable>;
}

function NewsRow({ story, saved, onBookmark }: { story: NewsStory; saved: boolean; onBookmark: () => void }) {
  return <View style={styles.newsRow}><View style={[styles.newsThumb, { backgroundColor: story.colors[0] }]}><View style={[styles.newsOrb, { backgroundColor: story.colors[1] }]} /><Text style={styles.newsThumbText}>{story.category}</Text></View><View style={styles.newsCopy}><Text style={styles.newsBadge}>{story.category}</Text><Text numberOfLines={2} style={styles.newsHeadline}>{story.headline}</Text><Text style={styles.newsMeta}>{story.source} · {story.time}</Text></View><Pressable accessibilityLabel={`${saved ? 'Remove' : 'Add'} news bookmark`} onPress={onBookmark} style={({ pressed }) => [styles.bookmarkButton, saved && styles.bookmarkActive, pressed && styles.pressed]}><Text style={[styles.bookmarkIcon, saved && styles.bookmarkIconActive]}>◆</Text></Pressable></View>;
}

function SpendingCard() {
  return <View style={styles.spendingCard}><View style={styles.spendingTop}><View><Text style={styles.overline}>MONTHLY BUDGET · SAMPLE DATA</Text><Text style={styles.spendingAmount}>$2,840 <Text style={styles.spendingOf}>of $4,200 spent</Text></Text></View><View style={styles.remainingBadge}><Text style={styles.remainingLabel}>REMAINING</Text><Text style={styles.remainingValue}>$1,360</Text></View></View><View style={styles.budgetTrack}><View style={styles.budgetFill} /></View><View style={styles.categories}><SpendingCategory name="Food" amount="$760" color="#69E08C" /><SpendingCategory name="Transportation" amount="$480" color="#6E90D8" /><SpendingCategory name="Entertainment" amount="$315" color="#C477B2" /></View></View>;
}

function SpendingCategory({ name, amount, color }: { name: string; amount: string; color: string }) {
  return <View style={styles.spendingCategory}><View style={[styles.categoryDot, { backgroundColor: color }]} /><View><Text style={styles.categoryName}>{name}</Text><Text style={styles.categoryAmount}>{amount}</Text></View></View>;
}

function SearchResults({ results, query, onSelect }: { results: FinanceAsset[]; query: string; onSelect: (asset: FinanceAsset) => void }) {
  return <View style={styles.searchResults}><Text style={styles.sectionTitle}>Search results</Text>{results.length === 0 ? <EmptyState title={`No matches for “${query}”`} copy="Try a company, symbol, ETF, index, crypto asset, or bond." /> : <View style={styles.listCard}>{results.map((asset, index) => <View key={asset.id}><Pressable onPress={() => onSelect(asset)} style={({ pressed }) => [styles.searchRow, pressed && styles.cardPressed]}><AssetLogo asset={asset} /><View style={styles.watchName}><Text style={styles.assetName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.symbol} · {asset.assetType}</Text></View><View style={styles.watchPrice}><Text style={styles.priceText}>{asset.displayValue}</Text><Text style={[styles.changeText, asset.dailyChangePercent < 0 && styles.negative]}>{asset.dailyChangePercent >= 0 ? '+' : ''}{asset.dailyChangePercent.toFixed(2)}%</Text></View></Pressable>{index < results.length - 1 && <View style={styles.divider} />}</View>)}</View>}</View>;
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
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#69E08C', fontSize: 11, fontWeight: '900', letterSpacing: 1.9, marginBottom: 7 },
  title: { color: '#FFFFFF', fontSize: 46, lineHeight: 50, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { color: '#8D96A3', fontSize: 16, marginTop: 6 },
  headerActions: { alignItems: 'center', gap: 10 },
  profileButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#233044', borderWidth: 1, borderColor: '#3A4B62', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: '#ECF2F8', fontSize: 12, fontWeight: '900' },
  settingsButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { color: '#69E08C', fontSize: 11 },
  simulatedDataLabel: { color: '#697582', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginBottom: 10, textAlign: 'right' },
  marketHoursCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 20, marginBottom: 18 },
  marketHoursGrid: { flexDirection: 'row', gap: 22 },
  marketHoursGridMobile: { flexDirection: 'column', gap: 18 },
  marketSummary: { flex: 0.86 },
  marketHoursHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  marketHoursEyebrow: { color: '#8B97A3', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  localBadge: { backgroundColor: '#202833', borderRadius: 8, color: '#778492', fontSize: 7, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 4 },
  statusLine: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 15 },
  marketStatusBadge: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 7, paddingHorizontal: 11, paddingVertical: 8 },
  marketStatusDot: { backgroundColor: '#D5DCE2', borderRadius: 4, height: 7, width: 7 },
  marketStatusText: { color: '#F4F7F9', fontSize: 12, fontWeight: '900' },
  statusOpen: { backgroundColor: 'rgba(105,224,140,0.16)', borderColor: '#69E08C', borderWidth: 1 },
  statusPre: { backgroundColor: 'rgba(88,157,224,0.18)', borderColor: '#589DE0', borderWidth: 1 },
  statusAfter: { backgroundColor: 'rgba(126,116,196,0.2)', borderColor: '#7E74C4', borderWidth: 1 },
  statusClosed: { backgroundColor: '#282F38', borderColor: '#3A444F', borderWidth: 1 },
  statusEarly: { backgroundColor: 'rgba(232,155,76,0.18)', borderColor: '#E89B4C', borderWidth: 1 },
  currentEt: { color: '#AAB4BF', fontSize: 11, fontWeight: '800' },
  countdown: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', lineHeight: 25, marginTop: 16 },
  regularHours: { flexDirection: 'row', gap: 34, marginTop: 19 },
  marketMetaLabel: { color: '#6F7B88', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  marketMetaValue: { color: '#CFD6DD', fontSize: 11, fontWeight: '800', marginTop: 5 },
  sessionsPanel: { flex: 1.14 },
  marketPanelTitle: { color: '#F0F3F6', fontSize: 13, fontWeight: '900' },
  sessionRows: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sessionRowsMobile: { flexDirection: 'column' },
  sessionChip: { backgroundColor: '#1C232B', borderColor: '#2B3540', borderRadius: 13, borderWidth: 1, flex: 1, minHeight: 74, padding: 11 },
  sessionChipActive: { backgroundColor: 'rgba(105,224,140,0.12)', borderColor: '#69E08C' },
  sessionTitle: { color: '#9AA5B0', fontSize: 10, fontWeight: '900' },
  sessionTitleActive: { color: '#89E9A5' },
  sessionTime: { color: '#65717D', fontSize: 8, lineHeight: 12, marginTop: 7 },
  sessionTimeActive: { color: '#9FBBA7' },
  marketCalendar: { borderTopColor: '#2A343E', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 20, paddingTop: 17 },
  calendarHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  configuredBadge: { color: '#737F8B', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  calendarGrid: { flexDirection: 'row', gap: 10, marginTop: 13 },
  calendarGridMobile: { flexWrap: 'wrap' },
  calendarDatum: { backgroundColor: '#1A2129', borderRadius: 12, flex: 1, minHeight: 62, minWidth: 130, padding: 10 },
  calendarLabel: { color: '#697582', fontSize: 7, fontWeight: '900', letterSpacing: 0.65 },
  calendarValue: { color: '#CCD3DA', fontSize: 9, fontWeight: '800', lineHeight: 13, marginTop: 6 },
  calendarValueAccent: { color: '#E8A85F' },
  marketHoursNote: { color: '#6F7B87', fontSize: 9, lineHeight: 14, marginTop: 15 },
  searchBar: { height: 54, borderRadius: 16, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 30 },
  searchIcon: { color: '#A2ACB8', fontSize: 27, marginRight: 10, marginTop: -4 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 0 },
  clearIcon: { color: '#AAB3BE', fontSize: 25, paddingLeft: 10 },
  portfolioCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 22, padding: 22, overflow: 'hidden', marginBottom: 52 },
  portfolioTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  overline: { color: '#75818D', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  balance: { color: '#FFFFFF', fontSize: 37, fontWeight: '900', letterSpacing: -1.1, marginTop: 7 },
  gainText: { color: '#69E08C', fontSize: 12, fontWeight: '800', marginTop: 6 },
  portfolioMark: { color: '#0A1510', backgroundColor: '#69E08C', width: 36, height: 36, borderRadius: 18, lineHeight: 36, textAlign: 'center', fontSize: 10, fontWeight: '900' },
  chart: { marginTop: 24, marginBottom: 14, overflow: 'hidden' },
  chartGrid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: '#29323C' },
  chartSegment: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: '#69E08C' },
  chartSegmentNegative: { backgroundColor: '#F06F78' },
  chartDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#69E08C', borderWidth: 1, borderColor: '#142019' },
  chartDotNegative: { backgroundColor: '#F06F78', borderColor: '#29191C' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  periodButton: { flex: 1, maxWidth: 70, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D242C' },
  periodButtonActive: { backgroundColor: '#69E08C' },
  periodText: { color: '#87929E', fontSize: 10, fontWeight: '900' },
  periodTextActive: { color: '#0A1510' },
  section: { marginBottom: 52 },
  sectionLast: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', letterSpacing: -0.45 },
  seeAll: { color: '#69E08C', fontSize: 13, fontWeight: '800' },
  horizontalCards: { gap: 16, paddingRight: 28, paddingBottom: 2 },
  indexCard: { width: 218, height: 142, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 15 },
  indexName: { color: '#8C97A3', fontSize: 11, fontWeight: '800' },
  indexValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 7 },
  indexBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1 },
  marketChange: { color: '#69E08C', fontSize: 11, fontWeight: '800' },
  marketPercent: { color: '#69E08C', fontSize: 10, marginTop: 3 },
  negative: { color: '#F06F78' },
  miniTrend: { height: 34, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  miniBar: { width: 3, borderRadius: 2, backgroundColor: '#69E08C' },
  miniBarNegative: { backgroundColor: '#F06F78' },
  listCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 14, overflow: 'hidden' },
  watchRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 7 },
  watchMain: { flex: 1, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetLogo: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  assetLogoText: { color: '#FFFFFF', fontWeight: '900' },
  watchName: { flex: 1, minWidth: 0 },
  assetName: { color: '#EEF2F6', fontSize: 14, fontWeight: '900' },
  assetTicker: { color: '#77838F', fontSize: 10, marginTop: 4 },
  watchPrice: { minWidth: 76, alignItems: 'flex-end' },
  priceText: { color: '#F5F7F9', fontSize: 13, fontWeight: '900' },
  changeText: { color: '#69E08C', fontSize: 10, fontWeight: '800', marginTop: 4 },
  starButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#202731', alignItems: 'center', justifyContent: 'center' },
  starActive: { backgroundColor: 'rgba(105,224,140,0.13)' },
  starText: { color: '#77828E', fontSize: 14 },
  starTextActive: { color: '#69E08C' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 53 },
  assetCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 21, overflow: 'hidden' },
  assetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assetIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetDetailName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  assetDetailPrice: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', textAlign: 'right' },
  assetDetailChange: { color: '#69E08C', fontSize: 10, fontWeight: '800', textAlign: 'right', marginTop: 4 },
  assetStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303944', marginTop: 19, paddingTop: 16 },
  statLabel: { color: '#707C88', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  statValue: { color: '#D8DEE5', fontSize: 12, fontWeight: '800', marginTop: 5 },
  assetDescription: { color: '#8994A0', fontSize: 12, lineHeight: 18, marginTop: 17, maxWidth: 720 },
  detailsButton: { alignSelf: 'flex-start', backgroundColor: '#26313C', borderRadius: 18, paddingHorizontal: 17, paddingVertical: 10, marginTop: 17 },
  detailsText: { color: '#E8EDF2', fontSize: 11, fontWeight: '900' },
  cryptoCard: { width: 190, height: 174, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 15 },
  cryptoTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  trendArrow: { color: '#69E08C', fontSize: 18, fontWeight: '900' },
  cryptoName: { color: '#F2F5F7', fontSize: 14, fontWeight: '900', marginTop: 12 },
  cryptoPrice: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 10 },
  newsCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  newsRow: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  newsThumb: { width: 82, height: 66, borderRadius: 11, overflow: 'hidden', justifyContent: 'flex-end', padding: 8 },
  newsOrb: { position: 'absolute', width: 68, height: 68, borderRadius: 34, right: -19, top: -22, opacity: 0.88 },
  newsThumbText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  newsCopy: { flex: 1, minWidth: 0 },
  newsBadge: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  newsHeadline: { color: '#EFF2F6', fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 4 },
  newsMeta: { color: '#75808C', fontSize: 10, marginTop: 5 },
  bookmarkButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#202731', borderWidth: 1, borderColor: '#2C3540', alignItems: 'center', justifyContent: 'center' },
  bookmarkActive: { backgroundColor: 'rgba(105,224,140,0.13)', borderColor: '#69E08C' },
  bookmarkIcon: { color: '#7A8591', fontSize: 11 },
  bookmarkIconActive: { color: '#69E08C' },
  newsDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 95 },
  spendingCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 21 },
  spendingTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  spendingAmount: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 7 },
  spendingOf: { color: '#818C98', fontSize: 11, fontWeight: '600' },
  remainingBadge: { alignItems: 'flex-end', backgroundColor: 'rgba(105,224,140,0.1)', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  remainingLabel: { color: '#71947D', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  remainingValue: { color: '#69E08C', fontSize: 14, fontWeight: '900', marginTop: 3 },
  budgetTrack: { height: 7, borderRadius: 4, backgroundColor: '#2B343E', overflow: 'hidden', marginTop: 20 },
  budgetFill: { width: '68%', height: 7, borderRadius: 4, backgroundColor: '#69E08C' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 26, marginTop: 20 },
  spendingCategory: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  categoryDot: { width: 9, height: 9, borderRadius: 5 },
  categoryName: { color: '#858F9B', fontSize: 10 },
  categoryAmount: { color: '#E1E6EB', fontSize: 12, fontWeight: '800', marginTop: 3 },
  disclaimer: { color: '#697581', fontSize: 10, lineHeight: 15, textAlign: 'center', maxWidth: 620, alignSelf: 'center', marginBottom: 12 },
  searchResults: { minHeight: 360 },
  searchRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 },
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
