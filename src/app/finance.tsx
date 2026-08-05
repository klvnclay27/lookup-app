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

type Period = '1D' | '1W' | '1M' | '3M' | '1Y';
type AssetType = 'Stock' | 'ETF' | 'Crypto';

type Asset = {
  id: string;
  name: string;
  ticker: string;
  type: AssetType;
  price: string;
  change: number;
  marketCap: string;
  range: string;
  description: string;
  colors: [string, string];
};

type NewsStory = {
  id: string;
  headline: string;
  source: string;
  time: string;
  category: string;
  colors: [string, string];
};

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '1Y'];

const CHART_DATA: Record<Period, number[]> = {
  '1D': [32, 34, 31, 38, 42, 40, 47, 45, 52, 57, 54, 61, 59, 66],
  '1W': [46, 43, 48, 51, 49, 56, 60, 58, 64, 62, 68, 71, 69, 75],
  '1M': [40, 44, 42, 47, 53, 50, 58, 63, 60, 67, 72, 70, 77, 82],
  '3M': [58, 54, 49, 52, 57, 61, 65, 63, 68, 73, 76, 80, 78, 85],
  '1Y': [28, 33, 30, 39, 43, 48, 45, 55, 59, 64, 70, 74, 81, 88],
};

const ASSETS: Asset[] = [
  { id: 'aapl', name: 'Apple', ticker: 'AAPL', type: 'Stock', price: '$228.34', change: 1.24, marketCap: '$3.42T', range: '$164.08 – $237.49', description: 'Apple designs consumer devices, software, and digital services worldwide.', colors: ['#3F4752', '#AAB3BD'] },
  { id: 'msft', name: 'Microsoft', ticker: 'MSFT', type: 'Stock', price: '$421.77', change: 0.86, marketCap: '$3.13T', range: '$344.77 – $468.35', description: 'Microsoft develops cloud, productivity, gaming, and AI products.', colors: ['#185A82', '#58A6C9'] },
  { id: 'tsla', name: 'Tesla', ticker: 'TSLA', type: 'Stock', price: '$248.91', change: -1.72, marketCap: '$794.2B', range: '$138.80 – $299.29', description: 'Tesla builds electric vehicles, energy storage, and charging products.', colors: ['#762C34', '#D55C65'] },
  { id: 'nvda', name: 'Nvidia', ticker: 'NVDA', type: 'Stock', price: '$138.62', change: 2.48, marketCap: '$3.39T', range: '$45.01 – $152.89', description: 'Nvidia creates accelerated computing platforms and graphics processors.', colors: ['#315C2B', '#76B852'] },
  { id: 'amzn', name: 'Amazon', ticker: 'AMZN', type: 'Stock', price: '$207.09', change: -0.38, marketCap: '$2.18T', range: '$142.81 – $215.90', description: 'Amazon operates commerce, cloud computing, media, and logistics services.', colors: ['#374A65', '#E39B43'] },
  { id: 'spy', name: 'SPDR S&P 500 ETF', ticker: 'SPY', type: 'ETF', price: '$598.73', change: 0.44, marketCap: '$550.8B', range: '$455.16 – $599.64', description: 'A mock exchange-traded fund designed to track the S&P 500 index.', colors: ['#32506A', '#6D9AC0'] },
  { id: 'btc', name: 'Bitcoin', ticker: 'BTC', type: 'Crypto', price: '$98,420', change: 2.14, marketCap: '$1.95T', range: '$38,505 – $108,268', description: 'Bitcoin is a decentralized digital asset represented here with simulated data.', colors: ['#80521F', '#F0A33A'] },
  { id: 'eth', name: 'Ethereum', ticker: 'ETH', type: 'Crypto', price: '$3,842', change: 1.32, marketCap: '$462.5B', range: '$2,111 – $4,092', description: 'Ethereum is a programmable blockchain asset represented with mock values.', colors: ['#3D4673', '#8B93D3'] },
  { id: 'sol', name: 'Solana', ticker: 'SOL', type: 'Crypto', price: '$217.18', change: -0.91, marketCap: '$105.6B', range: '$79.22 – $264.38', description: 'Solana is a blockchain network asset shown here using simulated prices.', colors: ['#4B286B', '#57D0A4'] },
  { id: 'xrp', name: 'XRP', ticker: 'XRP', type: 'Crypto', price: '$2.41', change: 0.67, marketCap: '$138.9B', range: '$0.39 – $2.87', description: 'XRP is a digital asset displayed with entirely local sample information.', colors: ['#314658', '#7DA0B8'] },
];

const WATCHLIST = ASSETS.slice(0, 5);
const CRYPTO = ASSETS.filter((asset) => asset.type === 'Crypto');

const INDEXES = [
  { name: 'S&P 500', value: '5,998.74', points: '+26.12', change: 0.44, trend: [4, 6, 5, 7, 8, 7, 10, 12] },
  { name: 'Dow Jones', value: '43,612.08', points: '-84.21', change: -0.19, trend: [11, 10, 12, 9, 8, 7, 8, 6] },
  { name: 'Nasdaq', value: '19,215.44', points: '+122.18', change: 0.64, trend: [5, 6, 8, 7, 10, 9, 12, 14] },
  { name: 'Russell 2000', value: '2,327.05', points: '-7.31', change: -0.31, trend: [12, 11, 9, 10, 8, 9, 7, 6] },
];

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
  const [selectedAsset, setSelectedAsset] = useState<Asset>(WATCHLIST[0]);
  const [favorites, setFavorites] = useState<string[]>(['aapl', 'nvda']);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 540);
    return () => clearTimeout(timer);
  }, []);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? ASSETS.filter((asset) => `${asset.name} ${asset.ticker} ${asset.type}`.toLowerCase().includes(normalized)) : [];
  }, [query]);

  const toggle = (id: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (isLoading) return <ScreenState loading title="Loading your money hub" copy="Preparing simulated market data…" />;
  if (error) return <ScreenState title="Finance is unavailable" copy={error} action="Try again" onAction={() => { setError(null); setIsLoading(true); setTimeout(() => setIsLoading(false), 450); }} />;

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: isDesktop ? 32 : 20, paddingBottom: insets.bottom + 100 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>YOUR MONEY HUB</Text><Text style={styles.title}>Finance</Text><Text style={styles.subtitle}>Markets and money at a glance.</Text></View>
        <View style={styles.headerActions}><Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable><Pressable accessibilityLabel="Finance notifications" onPress={() => Alert.alert('Notifications', 'Finance alerts are coming soon.')} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}><Text style={styles.settingsIcon}>●</Text></Pressable></View>
      </View>

      <View style={styles.marketStatus}><View style={styles.statusLeft}><View style={styles.statusDot} /><Text style={styles.marketOpen}>Market Open</Text><Text style={styles.simulatedBadge}>SIMULATED</Text></View><View style={styles.statusTimes}><Text style={styles.statusTime}>11:42 AM ET</Text><Text style={styles.statusClose}>Closes 4:00 PM</Text></View></View>

      <View style={styles.searchBar}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Search stocks, ETFs, crypto" autoCapitalize="characters" autoCorrect={false} onChangeText={setQuery} placeholder="Search stocks, ETFs, crypto" placeholderTextColor="#7E8793" returnKeyType="search" style={styles.searchInput} value={query} />{query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><Text style={styles.clearIcon}>×</Text></Pressable>}</View>

      {query.trim() ? (
        <SearchResults results={searchResults} query={query.trim()} onSelect={(asset) => { setSelectedAsset(asset); setQuery(''); }} />
      ) : (
        <>
          <PortfolioCard period={portfolioPeriod} onPeriod={setPortfolioPeriod} chartWidth={chartWidth} />

          <View style={styles.section}><SectionHeader title="Market Indexes" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{INDEXES.map((index) => <IndexCard key={index.name} index={index} />)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Watchlist" /><View style={styles.listCard}>{WATCHLIST.map((asset, index) => <View key={asset.id}><WatchlistRow asset={asset} favorite={favorites.includes(asset.id)} onSelect={() => setSelectedAsset(asset)} onFavorite={() => toggle(asset.id, setFavorites)} />{index < WATCHLIST.length - 1 && <View style={styles.divider} />}</View>)}</View></View>

          <View style={styles.section}><SectionHeader title="Asset Snapshot" /><AssetDetail asset={selectedAsset} period={assetPeriod} onPeriod={setAssetPeriod} chartWidth={chartWidth} /></View>

          <View style={styles.section}><SectionHeader title="Crypto" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{CRYPTO.map((asset) => <CryptoCard key={asset.id} asset={asset} onPress={() => setSelectedAsset(asset)} />)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Market News" /><View style={styles.newsCard}>{NEWS.map((story, index) => <View key={story.id}><NewsRow story={story} saved={bookmarks.includes(story.id)} onBookmark={() => toggle(story.id, setBookmarks)} />{index < NEWS.length - 1 && <View style={styles.newsDivider} />}</View>)}</View></View>

          <View style={styles.sectionLast}><SectionHeader title="Spending Snapshot" /><SpendingCard /></View>

          <Text style={styles.disclaimer}>Market and portfolio information shown in this MVP is simulated and is not financial advice.</Text>
        </>
      )}
    </ScrollView>
  );
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

function IndexCard({ index }: { index: typeof INDEXES[number] }) {
  const positive = index.change >= 0;
  return <View style={styles.indexCard}><Text style={styles.indexName}>{index.name}</Text><Text style={styles.indexValue}>{index.value}</Text><View style={styles.indexBottom}><View><Text style={[styles.marketChange, !positive && styles.negative]}>{index.points}</Text><Text style={[styles.marketPercent, !positive && styles.negative]}>{positive ? '+' : ''}{index.change.toFixed(2)}%</Text></View><MiniTrend values={index.trend} positive={positive} /></View></View>;
}

function AssetLogo({ asset, size = 42 }: { asset: Asset; size?: number }) {
  return <View style={[styles.assetLogo, { width: size, height: size, borderRadius: size / 2, backgroundColor: asset.colors[0], borderColor: asset.colors[1] }]}><Text style={[styles.assetLogoText, { fontSize: size * 0.25 }]}>{asset.ticker.slice(0, 3)}</Text></View>;
}

function WatchlistRow({ asset, favorite, onSelect, onFavorite }: { asset: Asset; favorite: boolean; onSelect: () => void; onFavorite: () => void }) {
  const positive = asset.change >= 0;
  return <View style={styles.watchRow}><Pressable onPress={onSelect} style={({ pressed }) => [styles.watchMain, pressed && styles.cardPressed]}><AssetLogo asset={asset} /><View style={styles.watchName}><Text style={styles.assetName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.ticker} · {asset.type}</Text></View><MiniTrend values={positive ? [4, 6, 5, 8, 7, 10] : [10, 8, 9, 6, 7, 4]} positive={positive} /><View style={styles.watchPrice}><Text style={styles.priceText}>{asset.price}</Text><Text style={[styles.changeText, !positive && styles.negative]}>{positive ? '+' : ''}{asset.change.toFixed(2)}%</Text></View></Pressable><Pressable accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${asset.name} favorite`} onPress={onFavorite} style={({ pressed }) => [styles.starButton, favorite && styles.starActive, pressed && styles.pressed]}><Text style={[styles.starText, favorite && styles.starTextActive]}>★</Text></Pressable></View>;
}

function AssetDetail({ asset, period, onPeriod, chartWidth }: { asset: Asset; period: Period; onPeriod: (period: Period) => void; chartWidth: number }) {
  const positive = asset.change >= 0;
  const data = positive ? CHART_DATA[period] : [...CHART_DATA[period]].reverse();
  return <View style={styles.assetCard}><View style={styles.assetHeader}><View style={styles.assetIdentity}><AssetLogo asset={asset} size={50} /><View><Text style={styles.assetDetailName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.ticker} · {asset.type}</Text></View></View><View><Text style={styles.assetDetailPrice}>{asset.price}</Text><Text style={[styles.assetDetailChange, !positive && styles.negative]}>{positive ? '+' : ''}{asset.change.toFixed(2)}% today</Text></View></View><ScrollView horizontal showsHorizontalScrollIndicator={false}><ViewLineChart data={data} width={chartWidth} positive={positive} height={112} /></ScrollView><PeriodSelector value={period} onChange={onPeriod} /><View style={styles.assetStats}><View><Text style={styles.statLabel}>MARKET CAP</Text><Text style={styles.statValue}>{asset.marketCap}</Text></View><View><Text style={styles.statLabel}>52-WEEK RANGE</Text><Text style={styles.statValue}>{asset.range}</Text></View></View><Text style={styles.assetDescription}>{asset.description}</Text><Pressable onPress={() => Alert.alert(asset.name, 'A full asset details experience is coming soon.')} style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}><Text style={styles.detailsText}>View details</Text></Pressable></View>;
}

function CryptoCard({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  const positive = asset.change >= 0;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.cryptoCard, pressed && styles.cardPressed]}><View style={styles.cryptoTop}><AssetLogo asset={asset} /><Text style={[styles.trendArrow, !positive && styles.negative]}>{positive ? '↗' : '↘'}</Text></View><Text style={styles.cryptoName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.ticker}</Text><Text style={styles.cryptoPrice}>{asset.price}</Text><Text style={[styles.changeText, !positive && styles.negative]}>{positive ? '+' : ''}{asset.change.toFixed(2)}%</Text></Pressable>;
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

function SearchResults({ results, query, onSelect }: { results: Asset[]; query: string; onSelect: (asset: Asset) => void }) {
  return <View style={styles.searchResults}><Text style={styles.sectionTitle}>Search results</Text>{results.length === 0 ? <EmptyState title={`No matches for “${query}”`} copy="Try a company, ticker, ETF, or crypto asset." /> : <View style={styles.listCard}>{results.map((asset, index) => <View key={asset.id}><Pressable onPress={() => onSelect(asset)} style={({ pressed }) => [styles.searchRow, pressed && styles.cardPressed]}><AssetLogo asset={asset} /><View style={styles.watchName}><Text style={styles.assetName}>{asset.name}</Text><Text style={styles.assetTicker}>{asset.ticker} · {asset.type}</Text></View><View style={styles.watchPrice}><Text style={styles.priceText}>{asset.price}</Text><Text style={[styles.changeText, asset.change < 0 && styles.negative]}>{asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%</Text></View></Pressable>{index < results.length - 1 && <View style={styles.divider} />}</View>)}</View>}</View>;
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
  marketStatus: { minHeight: 48, backgroundColor: '#141920', borderWidth: 1, borderColor: '#27303A', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 18 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69E08C' },
  marketOpen: { color: '#E8EDF2', fontSize: 12, fontWeight: '900' },
  simulatedBadge: { color: '#78838F', backgroundColor: '#202731', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, fontWeight: '900' },
  statusTimes: { alignItems: 'flex-end' },
  statusTime: { color: '#B2BBC5', fontSize: 10, fontWeight: '800' },
  statusClose: { color: '#6F7A86', fontSize: 9, marginTop: 2 },
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
