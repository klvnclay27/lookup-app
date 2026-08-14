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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isTabletWidth, pageHorizontalPadding } from '@/constants/layout';
import { getWeather, type WeatherDataProvenance, type WeatherSnapshot as WeatherDataSnapshot } from '@/services/weather';

type WeatherSnapshot = {
  temperature: number;
  condition: string;
  feelsLike: number;
  high: number;
  low: number;
  precipitationChance?: number;
};

type Location = {
  id: string;
  name: string;
  subtitle: string;
  snapshot?: WeatherSnapshot;
};

const LOCATIONS: Location[] = [
  { id: 'current', name: 'Current Location', subtitle: 'New York, NY' },
  { id: 'brooklyn', name: 'Brooklyn', subtitle: 'New York', snapshot: { temperature: 72, condition: 'Cloudy', feelsLike: 73, high: 77, low: 65 } },
  { id: 'manhattan', name: 'Manhattan', subtitle: 'New York', snapshot: { temperature: 75, condition: 'Sunny', feelsLike: 77, high: 81, low: 67 } },
  { id: 'baltimore', name: 'Baltimore', subtitle: 'Maryland', snapshot: { temperature: 79, condition: 'Rainy', feelsLike: 82, high: 83, low: 70 } },
];

const DETAIL_ITEMS = [
  { label: 'HUMIDITY', value: '62%', note: 'Comfortable', icon: 'H' },
  { label: 'WIND', value: '8 mph NE', note: 'Light breeze', icon: 'W' },
  { label: 'VISIBILITY', value: '9.8 mi', note: 'Clear view', icon: 'V' },
  { label: 'UV INDEX', value: '5 · Moderate', note: 'Protection advised', icon: 'U' },
  { label: 'PRESSURE', value: '30.08 in', note: 'Steady', icon: 'P' },
  { label: 'SUNRISE', value: '6:11 AM', note: 'First light 5:43', icon: '↑' },
  { label: 'SUNSET', value: '7:52 PM', note: 'Last light 8:20', icon: '↓' },
  { label: 'AIR QUALITY', value: '42 · Good', note: 'Low pollution', icon: 'A' },
];

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isTabletWidth(width);
  const [selectedLocation, setSelectedLocation] = useState<Location>(LOCATIONS[0]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [weatherData, setWeatherData] = useState<WeatherDataSnapshot | null>(null);
  const [weatherProvenance, setWeatherProvenance] = useState<WeatherDataProvenance>('unavailable');

  const loadCurrentWeather = async () => {
    if (weather) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await getWeather();
      setWeatherProvenance(result.provenance);
      if (result.provenance === 'unavailable') {
        setWeatherData(null);
        setError(result.error);
        return;
      }
      const data = result.data;
      const current = data.current;
      setWeatherData(data);
      setWeather({
        temperature: current.temperature,
        condition: current.condition,
        feelsLike: Math.round(current.feelsLike ?? current.temperature),
        high: Math.round(current.high ?? current.temperature),
        low: Math.round(current.low ?? current.temperature),
        precipitationChance: current.precipitationChance,
      });
      setLastUpdated('Just now');
    } catch {
      setError('We could not reach the current weather source. Check your connection and retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCurrentWeather();
  }, []);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? LOCATIONS.filter((location) => `${location.name} ${location.subtitle}`.toLowerCase().includes(normalized)) : [];
  }, [query]);

  const selectLocation = (location: Location) => {
    setSelectedLocation(location);
    setQuery('');
    setLastUpdated('Just now');
    if (location.id === 'current') {
      loadCurrentWeather();
    } else {
      setError(null);
      setWeatherData(null);
      setWeatherProvenance('mock');
      setWeather(location.snapshot ?? null);
      setIsLoading(false);
    }
  };

  if (isLoading) return <ScreenState loading title="Loading weather" copy="Checking conditions for your day…" />;
  if (error || !weather) return <ScreenState title="Weather is unavailable" copy={error ?? 'No weather data was returned.'} action="Retry" onAction={loadCurrentWeather} />;

  const hourly = buildHourly(weather, weatherData);
  const daily = buildDaily(weather, weatherData);
  const recommendation = getOutfitRecommendation(weather);

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: pageHorizontalPadding(width), paddingBottom: insets.bottom + 140 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>YOUR WEATHER HUB</Text><Text style={styles.title}>Weather</Text><Text style={styles.subtitle}>Plan your day with confidence.</Text></View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable>
          <View style={styles.headerUtilityRow}>
            <Pressable accessibilityLabel="Location settings" onPress={() => Alert.alert('Location', 'Location controls are coming soon.')} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}><Text style={styles.locationIcon}>◎</Text></Pressable>
            <Pressable accessibilityLabel={isRefreshing ? 'Refreshing weather' : 'Refresh weather'} disabled={isRefreshing} onPress={loadCurrentWeather} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
              {isRefreshing ? <ActivityIndicator color="#69E08C" size="small" /> : <Text style={styles.refreshIcon}>↻</Text>}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Search a city" autoCorrect={false} onChangeText={setQuery} placeholder="Search a city" placeholderTextColor="#7E8793" returnKeyType="search" style={styles.searchInput} value={query} />{query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><Text style={styles.clearIcon}>×</Text></Pressable>}</View>

      {query.trim() ? <LocationResults results={searchResults} query={query.trim()} onSelect={selectLocation} /> : (
        <>
          <CurrentWeatherHero location={selectedLocation} weather={weather} lastUpdated={lastUpdated} provenance={selectedLocation.id === 'current' ? weatherProvenance : 'mock'} />

          <View style={styles.section}><SectionHeader title="What to Wear" /><OutfitCard recommendation={recommendation} /></View>

          <View style={styles.section}><SectionHeader title="Hourly Forecast" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{hourly.map((hour, index) => <HourlyCard key={`${hour.time}-${index}`} hour={hour} current={index === 0} />)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Seven-Day Forecast" /><View style={styles.forecastList}>{daily.map((day, index) => <View key={day.day}><DailyRow day={day} />{index < daily.length - 1 && <View style={styles.divider} />}</View>)}</View></View>

          <View style={styles.section}><SectionHeader title="Weather Details" /><View style={styles.detailGrid}>{DETAIL_ITEMS.map((item) => <DetailCard key={item.label} item={item} cardWidth={isDesktop ? '23.5%' : '48%'} />)}</View><Text style={styles.simulatedLabel}>DETAIL VALUES ARE SIMULATED WHERE THE CURRENT SOURCE DOES NOT PROVIDE THEM</Text></View>

          <View style={styles.section}><SectionHeader title="Weather Alerts" /><WeatherAlert condition={weather.condition} location={selectedLocation.name} /></View>

          <View style={styles.section}><SectionHeader title="Precipitation Overview" /><PrecipitationCard rainy={weather.condition.toLowerCase().includes('rain')} /></View>

          <View style={styles.sectionLast}><SectionHeader title="Saved Locations" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{LOCATIONS.map((location) => <LocationCard key={location.id} location={location} selected={selectedLocation.id === location.id} currentWeather={weather} onPress={() => selectLocation(location)} />)}</ScrollView></View>

          <Text style={styles.disclaimer}>Hourly, daily, detail, alert, and saved-location forecasts shown in this MVP may use simulated values.</Text>
        </>
      )}
    </ScrollView>
  );
}

function weatherIcon(condition: string) {
  const normalized = condition.toLowerCase();
  if (normalized.includes('rain')) return '☂';
  if (normalized.includes('cloud')) return '☁';
  if (normalized.includes('snow')) return '✦';
  return '☀';
}

function CurrentWeatherHero({ location, weather, lastUpdated, provenance }: { location: Location; weather: WeatherSnapshot; lastUpdated: string; provenance: WeatherDataProvenance }) {
  const rainy = weather.condition.toLowerCase().includes('rain');
  return <View style={[styles.heroCard, rainy && styles.heroRain]}><View style={styles.heroOrb} /><View style={styles.heroTop}><View><Text style={styles.heroLocation}>{location.name}</Text><Text style={styles.heroSubtitle}>{location.subtitle} · {provenance === 'live' ? 'LIVE SOURCE' : 'SIMULATED'}</Text></View><Text style={styles.heroUpdated}>Updated {lastUpdated}</Text></View><View style={styles.heroMain}><View><Text style={styles.temperature}>{weather.temperature}°</Text><Text style={styles.condition}>{weather.condition}</Text><Text style={styles.feelsLike}>Feels like {weather.feelsLike}°</Text></View><Text style={styles.heroIcon}>{weatherIcon(weather.condition)}</Text></View><View style={styles.heroFooter}><View><Text style={styles.heroStatLabel}>TODAY’S HIGH</Text><Text style={styles.heroStat}>{weather.high}°</Text></View><View><Text style={styles.heroStatLabel}>TODAY’S LOW</Text><Text style={styles.heroStat}>{weather.low}°</Text></View><View><Text style={styles.heroStatLabel}>PRECIPITATION</Text><Text style={styles.heroStat}>{weather.precipitationChance ?? (rainy ? 78 : 12)}%</Text></View></View></View>;
}

function getOutfitRecommendation(weather: WeatherSnapshot) {
  const rainy = weather.condition.toLowerCase().includes('rain');
  if (weather.temperature <= 45) return { title: 'Warm layers', copy: 'Build warmth with a knit base, insulated outerwear, and covered accessories.', items: ['Knit', 'Coat', 'Scarf'], footwear: 'Weather-ready boots', reminder: rainy ? 'Bring an umbrella and a waterproof shell.' : 'Add gloves for colder hours.' };
  if (weather.temperature <= 65) return { title: 'Light layers', copy: 'A breathable base and light jacket will handle changing temperatures.', items: ['Tee', 'Jacket', 'Jeans'], footwear: 'Comfortable sneakers', reminder: rainy ? 'Pack an umbrella or rain jacket.' : 'Keep the jacket nearby after sunset.' };
  if (rainy) return { title: 'Warm-weather rain', copy: 'Stay cool with light fabrics while keeping a waterproof layer close.', items: ['Light top', 'Rain shell', 'Trousers'], footwear: 'Water-resistant sneakers', reminder: 'Bring an umbrella and avoid open footwear.' };
  return { title: 'Light and breathable', copy: 'Choose airy fabrics, a relaxed silhouette, and minimal layers for the afternoon.', items: ['Tee', 'Shorts', 'Sunglasses'], footwear: 'Breathable sneakers', reminder: 'Add sunscreen and carry water.' };
}

function OutfitCard({ recommendation }: { recommendation: ReturnType<typeof getOutfitRecommendation> }) {
  return <View style={styles.outfitCard}><View style={styles.outfitTop}><View style={styles.outfitCopy}><Text style={styles.outfitTitle}>{recommendation.title}</Text><Text style={styles.outfitDescription}>{recommendation.copy}</Text></View><View style={styles.hangerIcon}><Text style={styles.hangerText}>W</Text></View></View><View style={styles.clothingRow}>{recommendation.items.map((item, index) => <View key={item} style={styles.clothingItem}><View style={styles.clothingIcon}><Text style={styles.clothingIconText}>{index + 1}</Text></View><Text style={styles.clothingLabel}>{item}</Text></View>)}</View><View style={styles.recommendationRow}><Text style={styles.recommendationLabel}>FOOTWEAR</Text><Text style={styles.recommendationValue}>{recommendation.footwear}</Text></View><View style={styles.reminderRow}><Text style={styles.reminderMark}>!</Text><Text style={styles.reminderText}>{recommendation.reminder}</Text></View><Pressable onPress={() => router.push('/my-locker')} style={({ pressed }) => [styles.outfitButton, pressed && styles.pressed]}><Text style={styles.outfitButtonText}>Build this outfit</Text></Pressable></View>;
}

function SectionHeader({ title }: { title: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={() => Alert.alert(title, 'The expanded forecast is coming soon.')} hitSlop={8}><Text style={styles.seeAll}>See all</Text></Pressable></View>;
}

function buildHourly(weather: WeatherSnapshot, weatherData: WeatherDataSnapshot | null) {
  if (weatherData?.hourly.length) {
    return weatherData.hourly.slice(0, 12).map((hour, index) => ({
      time: index === 0 ? 'Now' : new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' }),
      temperature: hour.temperature,
      condition: hour.condition,
      precipitation: hour.precipitationChance ?? 0,
    }));
  }
  return Array.from({ length: 12 }, (_, index) => ({ time: index === 0 ? 'Now' : `${((12 + index - 1) % 12) + 1} PM`, temperature: weather.temperature + Math.round(Math.sin(index / 2) * 4), condition: index > 5 && index < 9 ? 'Cloudy' : weather.condition, precipitation: weather.condition.toLowerCase().includes('rain') ? 65 + (index % 3) * 8 : 8 + (index % 4) * 5 }));
}

function HourlyCard({ hour, current }: { hour: ReturnType<typeof buildHourly>[number]; current: boolean }) {
  return <View style={[styles.hourCard, current && styles.hourCardCurrent]}><Text style={[styles.hourTime, current && styles.currentText]}>{hour.time}</Text><Text style={styles.hourIcon}>{weatherIcon(hour.condition)}</Text><Text style={styles.hourTemperature}>{hour.temperature}°</Text><Text style={styles.precipitation}>⌁ {hour.precipitation}%</Text></View>;
}

function buildDaily(weather: WeatherSnapshot, weatherData: WeatherDataSnapshot | null) {
  if (weatherData?.daily.length) {
    return weatherData.daily.slice(0, 7).map((day, index) => ({
      day: index === 0 ? 'Today' : new Date(`${day.date}T12:00:00`).toLocaleDateString([], { weekday: 'long' }),
      condition: day.condition,
      low: day.low,
      high: day.high,
      precipitation: day.precipitationChance ?? 0,
    }));
  }
  const days = ['Today', 'Tomorrow', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'];
  return days.map((day, index) => ({ day, condition: index === 2 || index === 5 ? 'Cloudy' : index === 3 ? 'Rainy' : weather.condition, low: weather.low + (index % 3) - 1, high: weather.high + (index % 4) - 1, precipitation: index === 3 ? 72 : 8 + index * 5 }));
}

function DailyRow({ day }: { day: ReturnType<typeof buildDaily>[number] }) {
  const rangeStart = `${Math.max(5, ((day.low - 45) / 50) * 55)}%` as `${number}%`;
  const rangeWidth = `${Math.max(22, ((day.high - day.low) / 35) * 55)}%` as `${number}%`;
  return <View style={styles.dailyRow}><Text style={styles.dayName}>{day.day}</Text><Text style={styles.dailyIcon}>{weatherIcon(day.condition)}</Text><View style={styles.dailyCondition}><Text style={styles.conditionName}>{day.condition}</Text><Text style={styles.dailyPrecipitation}>{day.precipitation}% precip.</Text></View><Text style={styles.lowTemp}>{day.low}°</Text><View style={styles.rangeTrack}><View style={[styles.rangeFill, { left: rangeStart, width: rangeWidth }]} /></View><Text style={styles.highTemp}>{day.high}°</Text></View>;
}

function DetailCard({ item, cardWidth }: { item: typeof DETAIL_ITEMS[number]; cardWidth: '23.5%' | '48%' }) {
  return <View style={[styles.detailCard, { width: cardWidth }]}><View style={styles.detailTop}><Text style={styles.detailIcon}>{item.icon}</Text><Text style={styles.detailLabel}>{item.label}</Text></View><Text style={styles.detailValue}>{item.value}</Text><Text style={styles.detailNote}>{item.note}</Text></View>;
}

function WeatherAlert({ condition, location }: { condition: string; location: string }) {
  const active = condition.toLowerCase().includes('rain');
  return active ? <View style={styles.alertCard}><View style={styles.alertIcon}><Text style={styles.alertIconText}>!</Text></View><View style={styles.alertCopy}><View style={styles.alertTitleRow}><Text style={styles.alertTitle}>Heavy Rain Advisory</Text><Text style={styles.alertSeverity}>MODERATE</Text></View><Text style={styles.alertTime}>{location} · 2:00 PM – 7:00 PM</Text><Text style={styles.alertMessage}>Use caution on wet roads and allow extra travel time. This alert is simulated.</Text></View></View> : <View style={styles.noAlertCard}><View style={styles.noAlertIcon}><Text style={styles.noAlertIconText}>✓</Text></View><View><Text style={styles.noAlertTitle}>No active alerts</Text><Text style={styles.noAlertCopy}>No simulated weather alerts for this location.</Text></View></View>;
}

function PrecipitationCard({ rainy }: { rainy: boolean }) {
  const values = rainy ? [32, 48, 62, 78, 72, 55, 40, 28] : [8, 12, 9, 18, 14, 10, 7, 5];
  return <View style={styles.precipCard}><View style={styles.precipHeader}><View><Text style={styles.overline}>TODAY · SIMULATED</Text><Text style={styles.precipTitle}>{rainy ? 'Rain likely this afternoon' : 'Low chance of rain'}</Text></View><Text style={styles.precipTotal}>{Math.max(...values)}%</Text></View><View style={styles.precipChart}>{values.map((value, index) => <View key={index} style={styles.precipColumn}><View style={styles.barTrack}><View style={[styles.precipBar, { height: `${value}%` }]} /></View><Text style={styles.barLabel}>{index % 2 === 0 ? `${index + 12}` : ''}</Text></View>)}</View></View>;
}

function LocationCard({ location, selected, currentWeather, onPress }: { location: Location; selected: boolean; currentWeather: WeatherSnapshot; onPress: () => void }) {
  const snapshot = location.id === 'current' ? currentWeather : location.snapshot;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.locationCard, selected && styles.locationCardSelected, pressed && styles.cardPressed]}><View style={styles.locationTop}><Text style={styles.locationBadge}>{location.id === 'current' ? '◎' : location.name.slice(0, 1)}</Text><Text style={styles.locationTemperature}>{snapshot?.temperature ?? '–'}°</Text></View><Text numberOfLines={1} style={styles.locationName}>{location.name}</Text><Text style={styles.locationSubtitle}>{location.subtitle}</Text><Text style={styles.locationCondition}>{snapshot?.condition ?? 'Unavailable'}</Text></Pressable>;
}

function LocationResults({ results, query, onSelect }: { results: Location[]; query: string; onSelect: (location: Location) => void }) {
  return <View style={styles.searchResults}><Text style={styles.sectionTitle}>Locations</Text>{results.length === 0 ? <EmptyState title={`No matches for “${query}”`} copy="Try Current Location, Brooklyn, Manhattan, or Baltimore." /> : <View style={styles.resultsCard}>{results.map((location, index) => <View key={location.id}><Pressable onPress={() => onSelect(location)} style={({ pressed }) => [styles.resultRow, pressed && styles.cardPressed]}><View style={styles.resultIcon}><Text style={styles.resultIconText}>{location.name.slice(0, 1)}</Text></View><View style={styles.resultCopy}><Text style={styles.resultTitle}>{location.name}</Text><Text style={styles.resultSubtitle}>{location.subtitle}</Text></View><Text style={styles.resultArrow}>›</Text></Pressable>{index < results.length - 1 && <View style={styles.resultDivider} />}</View>)}</View>}</View>;
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
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 25 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#69E08C', fontSize: 11, fontWeight: '900', letterSpacing: 1.9, marginBottom: 7 },
  title: { color: '#FFFFFF', fontSize: 46, lineHeight: 50, fontWeight: '900', letterSpacing: -1.5 },
  subtitle: { color: '#8D96A3', fontSize: 16, marginTop: 6 },
  headerActions: { alignItems: 'center', gap: 10 },
  headerUtilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#233044', borderWidth: 1, borderColor: '#3A4B62', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: '#ECF2F8', fontSize: 12, fontWeight: '900' },
  locationButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  locationIcon: { color: '#69E08C', fontSize: 17, fontWeight: '900' },
  refreshButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { color: '#69E08C', fontSize: 18, lineHeight: 20, fontWeight: '900' },
  searchBar: { height: 54, borderRadius: 16, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 26 },
  searchIcon: { color: '#A2ACB8', fontSize: 27, marginRight: 10, marginTop: -4 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 0 },
  clearIcon: { color: '#AAB3BE', fontSize: 25, paddingLeft: 10 },
  heroCard: { minHeight: 330, borderRadius: 22, backgroundColor: '#244C6A', borderWidth: 1, borderColor: '#3E657D', padding: 24, overflow: 'hidden', marginBottom: 52 },
  heroRain: { backgroundColor: '#304154', borderColor: '#53697B' },
  heroOrb: { position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: '#5FA8CF', opacity: 0.25, right: -115, top: -150 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLocation: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.62)', fontSize: 9, fontWeight: '800', marginTop: 5, letterSpacing: 0.5 },
  heroUpdated: { color: 'rgba(255,255,255,0.62)', fontSize: 9 },
  heroMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 28 },
  temperature: { color: '#FFFFFF', fontSize: 70, lineHeight: 76, fontWeight: '300', letterSpacing: -3 },
  condition: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  feelsLike: { color: 'rgba(255,255,255,0.66)', fontSize: 11, marginTop: 5 },
  heroIcon: { color: '#F4D574', fontSize: 78, lineHeight: 86 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 36, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.25)', paddingTop: 17 },
  heroStatLabel: { color: 'rgba(255,255,255,0.56)', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  heroStat: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 5 },
  section: { marginBottom: 52 },
  sectionLast: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', letterSpacing: -0.45 },
  seeAll: { color: '#69E08C', fontSize: 13, fontWeight: '800' },
  outfitCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 21 },
  outfitTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 },
  outfitCopy: { flex: 1 },
  outfitTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  outfitDescription: { color: '#8D98A4', fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 650 },
  hangerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(105,224,140,0.12)', alignItems: 'center', justifyContent: 'center' },
  hangerText: { color: '#69E08C', fontSize: 12, fontWeight: '900' },
  clothingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 20 },
  clothingItem: { alignItems: 'center', gap: 6 },
  clothingIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#202832', borderWidth: 1, borderColor: '#303B46', alignItems: 'center', justifyContent: 'center' },
  clothingIconText: { color: '#C8D0D8', fontSize: 12, fontWeight: '900' },
  clothingLabel: { color: '#7E8995', fontSize: 9, fontWeight: '700' },
  recommendationRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303944', marginTop: 19, paddingTop: 15 },
  recommendationLabel: { color: '#697581', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  recommendationValue: { color: '#C5CDD5', fontSize: 11, fontWeight: '800' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#1B232B', borderRadius: 12, padding: 11, marginTop: 14 },
  reminderMark: { color: '#69E08C', fontSize: 12, fontWeight: '900' },
  reminderText: { flex: 1, color: '#9AA4AF', fontSize: 10 },
  outfitButton: { alignSelf: 'flex-start', backgroundColor: '#69E08C', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, marginTop: 16 },
  outfitButtonText: { color: '#09140E', fontSize: 11, fontWeight: '900' },
  horizontalCards: { gap: 14, paddingRight: 28, paddingBottom: 2 },
  hourCard: { width: 94, height: 142, borderRadius: 17, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', alignItems: 'center', justifyContent: 'center' },
  hourCardCurrent: { borderColor: '#69E08C', backgroundColor: 'rgba(105,224,140,0.08)' },
  hourTime: { color: '#88939F', fontSize: 10, fontWeight: '800' },
  currentText: { color: '#69E08C' },
  hourIcon: { color: '#E7C766', fontSize: 27, marginTop: 9 },
  hourTemperature: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 6 },
  precipitation: { color: '#72A8D0', fontSize: 9, fontWeight: '700', marginTop: 6 },
  forecastList: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  dailyRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { width: 78, color: '#EFF2F6', fontSize: 12, fontWeight: '900' },
  dailyIcon: { width: 26, color: '#E4C568', fontSize: 19, textAlign: 'center' },
  dailyCondition: { flex: 1, minWidth: 68 },
  conditionName: { color: '#BAC2CA', fontSize: 11, fontWeight: '700' },
  dailyPrecipitation: { color: '#6F9DBE', fontSize: 8, marginTop: 3 },
  lowTemp: { width: 28, color: '#75818D', fontSize: 11, fontWeight: '800' },
  highTemp: { width: 30, color: '#FFFFFF', fontSize: 11, fontWeight: '900', textAlign: 'right' },
  rangeTrack: { width: 92, height: 5, borderRadius: 3, backgroundColor: '#29323C', overflow: 'hidden' },
  rangeFill: { position: 'absolute', height: 5, borderRadius: 3, backgroundColor: '#69E08C' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 114 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailCard: { minHeight: 124, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 14 },
  detailTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { color: '#69E08C', fontSize: 11, fontWeight: '900' },
  detailLabel: { color: '#717D89', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  detailValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 15 },
  detailNote: { color: '#77828E', fontSize: 9, marginTop: 6 },
  simulatedLabel: { color: '#626E7A', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, textAlign: 'right', marginTop: 9 },
  alertCard: { backgroundColor: '#211D1C', borderWidth: 1, borderColor: '#5A4935', borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  alertIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(224,178,79,0.13)', alignItems: 'center', justifyContent: 'center' },
  alertIconText: { color: '#E0B24F', fontSize: 17, fontWeight: '900' },
  alertCopy: { flex: 1 },
  alertTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9 },
  alertTitle: { color: '#F2EDE6', fontSize: 14, fontWeight: '900' },
  alertSeverity: { color: '#D9AA4B', backgroundColor: 'rgba(224,178,79,0.12)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 7, fontWeight: '900' },
  alertTime: { color: '#A59276', fontSize: 9, marginTop: 6 },
  alertMessage: { color: '#A99E91', fontSize: 11, lineHeight: 16, marginTop: 7 },
  noAlertCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13 },
  noAlertIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(105,224,140,0.11)', alignItems: 'center', justifyContent: 'center' },
  noAlertIconText: { color: '#69E08C', fontSize: 14, fontWeight: '900' },
  noAlertTitle: { color: '#EAF0F5', fontSize: 14, fontWeight: '900' },
  noAlertCopy: { color: '#7D8994', fontSize: 10, marginTop: 4 },
  precipCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 20 },
  precipHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  overline: { color: '#6F7B87', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  precipTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 6 },
  precipTotal: { color: '#74ADD3', fontSize: 23, fontWeight: '900' },
  precipChart: { height: 112, flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginTop: 20 },
  precipColumn: { flex: 1, height: 112, alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: { width: '70%', flex: 1, borderRadius: 5, backgroundColor: '#202A32', overflow: 'hidden', justifyContent: 'flex-end' },
  precipBar: { width: '100%', borderRadius: 5, backgroundColor: '#5B9CC7' },
  barLabel: { color: '#697581', fontSize: 8, marginTop: 6, height: 10 },
  locationCard: { width: 214, height: 146, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 15 },
  locationCardSelected: { borderColor: '#69E08C' },
  locationTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationBadge: { width: 32, height: 32, borderRadius: 10, lineHeight: 32, textAlign: 'center', color: '#69E08C', backgroundColor: '#22302D', fontSize: 11, fontWeight: '900' },
  locationTemperature: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  locationName: { color: '#EFF2F6', fontSize: 13, fontWeight: '900', marginTop: 14 },
  locationSubtitle: { color: '#77828E', fontSize: 9, marginTop: 4 },
  locationCondition: { color: '#92A0AC', fontSize: 10, marginTop: 8 },
  disclaimer: { color: '#697581', fontSize: 10, lineHeight: 15, textAlign: 'center', maxWidth: 650, alignSelf: 'center', marginBottom: 12 },
  searchResults: { minHeight: 360 },
  resultsCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, marginTop: 16 },
  resultRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 },
  resultIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#22302D', alignItems: 'center', justifyContent: 'center' },
  resultIconText: { color: '#69E08C', fontSize: 11, fontWeight: '900' },
  resultCopy: { flex: 1 },
  resultTitle: { color: '#EFF2F6', fontSize: 13, fontWeight: '900' },
  resultSubtitle: { color: '#77828E', fontSize: 10, marginTop: 4 },
  resultArrow: { color: '#65717D', fontSize: 22 },
  resultDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 49 },
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
