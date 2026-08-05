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

type TravelMode = 'Drive' | 'Transit' | 'Walk' | 'Bike';
type TrafficLevel = 'Light' | 'Moderate' | 'Heavy';

type Destination = {
  id: string;
  name: string;
  address: string;
  icon: string;
  condition: TrafficLevel;
  modes: Record<TravelMode, { time: string; distance: string; arrival: string; route: string }>;
};

type Incident = {
  id: string;
  icon: string;
  road: string;
  description: string;
  distance: string;
  severity: 'Low' | 'Medium' | 'High' | 'Severe';
  delay: string;
};

const MODES: TravelMode[] = ['Drive', 'Transit', 'Walk', 'Bike'];

const DESTINATIONS: Destination[] = [
  { id: 'home', name: 'Home', address: '128 W 74th St, Manhattan', icon: 'H', condition: 'Moderate', modes: { Drive: { time: '28 min', distance: '8.4 mi', arrival: '12:18 PM', route: 'FDR Drive via E 96th St' }, Transit: { time: '36 min', distance: '7 stops', arrival: '12:26 PM', route: '4 train → 2 train' }, Walk: { time: '2 hr 18 min', distance: '6.7 mi', arrival: '2:08 PM', route: 'Lexington Ave → Central Park W' }, Bike: { time: '46 min', distance: '7.2 mi', arrival: '12:36 PM', route: 'East River Greenway' } } },
  { id: 'work', name: 'Work', address: '11 Madison Ave, Manhattan', icon: 'W', condition: 'Heavy', modes: { Drive: { time: '34 min', distance: '7.8 mi', arrival: '12:24 PM', route: 'FDR Drive → E 23rd St' }, Transit: { time: '29 min', distance: '6 stops', arrival: '12:19 PM', route: '6 train to 23rd St' }, Walk: { time: '1 hr 42 min', distance: '5.1 mi', arrival: '1:32 PM', route: 'Park Ave southbound' }, Bike: { time: '39 min', distance: '5.8 mi', arrival: '12:29 PM', route: '2nd Ave bike lane' } } },
  { id: 'gym', name: 'Gym', address: '250 Mercer St, Manhattan', icon: 'G', condition: 'Light', modes: { Drive: { time: '22 min', distance: '5.9 mi', arrival: '12:12 PM', route: 'FDR Drive → Houston St' }, Transit: { time: '31 min', distance: '5 stops', arrival: '12:21 PM', route: '6 train to Bleecker St' }, Walk: { time: '1 hr 25 min', distance: '4.2 mi', arrival: '1:15 PM', route: 'Broadway southbound' }, Bike: { time: '31 min', distance: '4.7 mi', arrival: '12:21 PM', route: 'Broadway protected lanes' } } },
  { id: 'restaurant', name: 'Favorite Restaurant', address: '42 Grove St, West Village', icon: 'R', condition: 'Moderate', modes: { Drive: { time: '31 min', distance: '6.3 mi', arrival: '12:21 PM', route: 'FDR Drive → Houston St' }, Transit: { time: '38 min', distance: '8 stops', arrival: '12:28 PM', route: 'A train to W 4th St' }, Walk: { time: '1 hr 51 min', distance: '5.5 mi', arrival: '1:41 PM', route: '5th Ave → Greenwich Ave' }, Bike: { time: '37 min', distance: '5.4 mi', arrival: '12:27 PM', route: 'Hudson River Greenway' } } },
  { id: 'museum', name: 'Metropolitan Museum', address: '1000 5th Ave, Manhattan', icon: 'M', condition: 'Light', modes: { Drive: { time: '14 min', distance: '2.8 mi', arrival: '12:04 PM', route: '5th Ave northbound' }, Transit: { time: '24 min', distance: '3 stops', arrival: '12:14 PM', route: '4 train → M86 bus' }, Walk: { time: '43 min', distance: '2.1 mi', arrival: '12:33 PM', route: 'Madison Ave → E 82nd St' }, Bike: { time: '18 min', distance: '2.4 mi', arrival: '12:08 PM', route: 'Central Park loop' } } },
];

const INCIDENTS: Incident[] = [
  { id: 'accident', icon: '!', road: 'FDR Drive · E 71st St', description: 'Two-vehicle accident blocking the right lane', distance: '1.2 mi away', severity: 'High', delay: '+12 min' },
  { id: 'construction', icon: '◇', road: '2nd Ave · E 42nd St', description: 'Night construction with one lane restricted', distance: '2.8 mi away', severity: 'Medium', delay: '+6 min' },
  { id: 'closure', icon: '×', road: 'W 34th St · 7th Ave', description: 'Road closed for a scheduled public event', distance: '3.4 mi away', severity: 'Severe', delay: '+18 min' },
  { id: 'congestion', icon: '≈', road: 'Brooklyn Bridge', description: 'Heavy congestion approaching Manhattan', distance: '4.1 mi away', severity: 'Medium', delay: '+9 min' },
];

const TRANSIT = [
  { line: '4', station: '86 St · Lexington Ave', arrival: '3 min', status: 'On time', color: '#2A9D55' },
  { line: '6', station: '77 St · Lexington Ave', arrival: '7 min', status: 'On time', color: '#2A9D55' },
  { line: 'M15', station: '1st Ave · E 79th St', arrival: '5 min', status: 'Minor delays', color: '#C98B38' },
  { line: 'Q', station: '72 St · 2nd Ave', arrival: '9 min', status: 'On time', color: '#D49B35' },
];

const HISTORY = [
  { destination: DESTINATIONS[1], day: 'Yesterday', time: '31 min', level: 'Heavy', mode: 'Drive' as TravelMode },
  { destination: DESTINATIONS[2], day: 'Monday', time: '28 min', level: 'Light', mode: 'Bike' as TravelMode },
  { destination: DESTINATIONS[0], day: 'Sunday', time: '35 min', level: 'Moderate', mode: 'Transit' as TravelMode },
];

export default function TrafficScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [selectedDestination, setSelectedDestination] = useState<Destination>(DESTINATIONS[1]);
  const [mode, setMode] = useState<TravelMode>('Drive');
  const [query, setQuery] = useState('');
  const [routeStarted, setRouteStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 520);
    return () => clearTimeout(timer);
  }, []);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? DESTINATIONS.filter((place) => `${place.name} ${place.address}`.toLowerCase().includes(normalized)) : [];
  }, [query]);

  const selectDestination = (destination: Destination) => {
    setSelectedDestination(destination);
    setRouteStarted(false);
    setQuery('');
  };

  const selectMode = (nextMode: TravelMode) => {
    setMode(nextMode);
    setRouteStarted(false);
  };

  if (isLoading) return <ScreenState loading title="Loading your commute" copy="Preparing simulated route information…" />;
  if (error) return <ScreenState title="Traffic is unavailable" copy={error} action="Try again" onAction={() => { setError(null); setIsLoading(true); setTimeout(() => setIsLoading(false), 450); }} />;

  const route = selectedDestination.modes[mode];

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: isDesktop ? 32 : 20, paddingBottom: insets.bottom + 100 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>YOUR COMMUTE HUB</Text><Text style={styles.title}>Traffic</Text><Text style={styles.subtitle}>Know before you go.</Text></View>
        <View style={styles.headerActions}><Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable><Pressable accessibilityLabel="Map layers" onPress={() => Alert.alert('Map layers', 'More simulated map layers are coming soon.')} style={({ pressed }) => [styles.layersButton, pressed && styles.pressed]}><Text style={styles.layersIcon}>▱</Text></Pressable></View>
      </View>

      <View style={styles.searchBar}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Where are you going?" autoCorrect={false} onChangeText={setQuery} placeholder="Where are you going?" placeholderTextColor="#7E8793" returnKeyType="search" style={styles.searchInput} value={query} />{query.length > 0 && <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><Text style={styles.clearIcon}>×</Text></Pressable>}</View>

      <View style={styles.shortcuts}><Pressable onPress={() => selectDestination(DESTINATIONS[0])} style={({ pressed }) => [styles.shortcutButton, selectedDestination.id === 'home' && styles.shortcutActive, pressed && styles.pressed]}><Text style={styles.shortcutIcon}>H</Text><Text style={styles.shortcutText}>Home</Text></Pressable><Pressable onPress={() => selectDestination(DESTINATIONS[1])} style={({ pressed }) => [styles.shortcutButton, selectedDestination.id === 'work' && styles.shortcutActive, pressed && styles.pressed]}><Text style={styles.shortcutIcon}>W</Text><Text style={styles.shortcutText}>Work</Text></Pressable></View>

      {query.trim() ? <DestinationResults results={searchResults} query={query.trim()} onSelect={selectDestination} /> : (
        <>
          <MockMap destination={selectedDestination} onRecenter={() => Alert.alert('Recentered', 'The simulated map is centered on your current location.')} />
          <RouteSummary destination={selectedDestination} mode={mode} route={route} started={routeStarted} onStart={() => setRouteStarted((current) => !current)} />

          <View style={styles.section}><SectionHeader title="Commute Options" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRow}>{MODES.map((item) => <Pressable key={item} onPress={() => selectMode(item)} style={({ pressed }) => [styles.modeButton, mode === item && styles.modeActive, pressed && styles.pressed]}><Text style={[styles.modeIcon, mode === item && styles.modeTextActive]}>{item.slice(0, 1)}</Text><Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item}</Text></Pressable>)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Saved Places" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>{DESTINATIONS.slice(0, 4).map((place) => <SavedPlaceCard key={place.id} place={place} mode={mode} selected={selectedDestination.id === place.id} onPress={() => selectDestination(place)} />)}</ScrollView></View>

          <View style={styles.section}><SectionHeader title="Traffic Incidents" /><View style={styles.listCard}>{INCIDENTS.map((incident, index) => <View key={incident.id}><IncidentRow incident={incident} />{index < INCIDENTS.length - 1 && <View style={styles.divider} />}</View>)}</View></View>

          <View style={styles.section}><SectionHeader title="Nearby Transit" action="See schedule" /><View style={styles.listCard}>{TRANSIT.map((transit, index) => <View key={`${transit.line}-${transit.station}`}><TransitRow transit={transit} />{index < TRANSIT.length - 1 && <View style={styles.transitDivider} />}</View>)}</View><Text style={styles.simulatedLabel}>SIMULATED TRANSIT INFORMATION</Text></View>

          <View style={styles.section}><SectionHeader title="Commute History" /><View style={styles.listCard}>{HISTORY.map((trip, index) => <View key={`${trip.destination.id}-${trip.day}`}><Pressable onPress={() => { selectDestination(trip.destination); selectMode(trip.mode); }} style={({ pressed }) => [styles.historyRow, pressed && styles.cardPressed]}><View style={styles.historyIcon}><Text style={styles.historyIconText}>{trip.destination.icon}</Text></View><View style={styles.historyCopy}><Text style={styles.historyDestination}>{trip.destination.name}</Text><Text style={styles.historyMeta}>{trip.day} · {trip.mode} · {trip.level} traffic</Text></View><Text style={styles.historyTime}>{trip.time}</Text><Text style={styles.chevron}>›</Text></Pressable>{index < HISTORY.length - 1 && <View style={styles.historyDivider} />}</View>)}</View></View>

          <View style={styles.sectionLast}><SectionHeader title="Traffic Overview" /><TrafficOverview /></View>
          <Text style={styles.disclaimer}>Traffic, transit, and route information shown in this MVP is simulated.</Text>
        </>
      )}
    </ScrollView>
  );
}

function MockMap({ destination, onRecenter }: { destination: Destination; onRecenter: () => void }) {
  return (
    <View style={styles.mapCard}>
      <View style={styles.mapGlow} />
      <MapRoad top="15%" left="-8%" width="118%" rotation="8deg" />
      <MapRoad top="39%" left="-12%" width="125%" rotation="-5deg" />
      <MapRoad top="69%" left="-6%" width="118%" rotation="11deg" />
      <MapRoad top="43%" left="8%" width="78%" rotation="78deg" />
      <MapRoad top="48%" left="39%" width="85%" rotation="92deg" />
      <MapRoad top="40%" left="65%" width="90%" rotation="103deg" />
      <View style={[styles.routeSegment, styles.routeGreen]} /><View style={[styles.routeSegment, styles.routeYellow]} /><View style={[styles.routeSegment, styles.routeRed]} />
      <View style={styles.alternateRoute} />
      <Text style={[styles.roadLabel, { top: '18%', left: '9%' }]}>E 96TH ST</Text><Text style={[styles.roadLabel, { top: '54%', left: '65%' }]}>FDR DRIVE</Text><Text style={[styles.roadLabel, { top: '75%', left: '25%' }]}>PARK AVE</Text>
      <View style={styles.currentMarker}><View style={styles.currentMarkerCore} /></View>
      <View style={styles.destinationMarker}><Text style={styles.destinationMarkerText}>{destination.icon}</Text></View>
      <View style={styles.mapLegend}><View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: '#69E08C' }]} /><Text style={styles.legendText}>Clear</Text></View><View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: '#E0B24F' }]} /><Text style={styles.legendText}>Slow</Text></View><View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: '#EB626C' }]} /><Text style={styles.legendText}>Heavy</Text></View></View>
      <View style={styles.zoomControls}><Pressable accessibilityLabel="Zoom in" onPress={() => Alert.alert('Zoom', 'Simulated map zoomed in.')} style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}><Text style={styles.zoomText}>+</Text></Pressable><View style={styles.zoomDivider} /><Pressable accessibilityLabel="Zoom out" onPress={() => Alert.alert('Zoom', 'Simulated map zoomed out.')} style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}><Text style={styles.zoomText}>−</Text></Pressable></View>
      <Pressable accessibilityLabel="Recenter map" onPress={onRecenter} style={({ pressed }) => [styles.recenterButton, pressed && styles.pressed]}><Text style={styles.recenterIcon}>◎</Text></Pressable>
      <Text style={styles.mapBadge}>SIMULATED MAP</Text>
    </View>
  );
}

function MapRoad({ top, left, width, rotation }: { top: `${number}%`; left: `${number}%`; width: `${number}%`; rotation: `${number}deg` }) {
  return <View style={[styles.mapRoad, { top, left, width, transform: [{ rotate: rotation }] }]} />;
}

function RouteSummary({ destination, mode, route, started, onStart }: { destination: Destination; mode: TravelMode; route: Destination['modes'][TravelMode]; started: boolean; onStart: () => void }) {
  return <View style={styles.routeCard}><View style={styles.routeTop}><View><Text style={styles.overline}>{mode.toUpperCase()} TO</Text><Text style={styles.routeDestination}>{destination.name}</Text><Text numberOfLines={1} style={styles.routeName}>{route.route}</Text></View><View style={styles.routeTimeBlock}><Text style={styles.routeTime}>{route.time}</Text><Text style={styles.trafficCondition}>{destination.condition} traffic</Text></View></View><View style={styles.routeStats}><RouteStat label="DISTANCE" value={route.distance} /><RouteStat label="ARRIVAL" value={route.arrival} /><RouteStat label="TIME SAVED" value="8 min" /></View><Pressable onPress={onStart} style={({ pressed }) => [styles.startButton, started && styles.startedButton, pressed && styles.pressed]}><Text style={[styles.startText, started && styles.startedText]}>{started ? 'Route started' : 'Start Route'}</Text></Pressable>{started && <Text style={styles.startedNote}>Preview active · No turn-by-turn navigation</Text>}</View>;
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return <View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

function SectionHeader({ title, action = 'See all' }: { title: string; action?: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={() => Alert.alert(title, `${action} is coming soon.`)} hitSlop={8}><Text style={styles.seeAll}>{action}</Text></Pressable></View>;
}

function SavedPlaceCard({ place, mode, selected, onPress }: { place: Destination; mode: TravelMode; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.placeCard, selected && styles.placeCardSelected, pressed && styles.cardPressed]}><View style={styles.placeTop}><View style={styles.placeIcon}><Text style={styles.placeIconText}>{place.icon}</Text></View><Text style={styles.placeTime}>{place.modes[mode].time}</Text></View><Text numberOfLines={1} style={styles.placeName}>{place.name}</Text><Text numberOfLines={1} style={styles.placeAddress}>{place.address}</Text><View style={styles.placeFooter}><View style={[styles.conditionDot, place.condition === 'Heavy' && styles.conditionHeavy, place.condition === 'Moderate' && styles.conditionModerate]} /><Text style={styles.placeCondition}>{place.condition} traffic</Text></View></Pressable>;
}

function IncidentRow({ incident }: { incident: Incident }) {
  const severe = incident.severity === 'Severe';
  const high = incident.severity === 'High';
  return <View style={styles.incidentRow}><View style={[styles.incidentIcon, severe && styles.severeBackground, high && styles.highBackground]}><Text style={[styles.incidentIconText, (severe || high) && styles.severeText]}>{incident.icon}</Text></View><View style={styles.incidentCopy}><Text style={styles.incidentRoad}>{incident.road}</Text><Text numberOfLines={2} style={styles.incidentDescription}>{incident.description}</Text><Text style={styles.incidentDistance}>{incident.distance}</Text></View><View style={styles.incidentRight}><Text style={[styles.severityBadge, severe && styles.severitySevere, high && styles.severityHigh]}>{incident.severity}</Text><Text style={styles.delayText}>{incident.delay}</Text></View></View>;
}

function TransitRow({ transit }: { transit: typeof TRANSIT[number] }) {
  return <View style={styles.transitRow}><View style={[styles.transitLine, { backgroundColor: transit.color }]}><Text style={styles.transitLineText}>{transit.line}</Text></View><View style={styles.transitCopy}><Text style={styles.transitStation}>{transit.station}</Text><Text style={styles.transitStatus}>{transit.status}</Text></View><Text style={styles.transitArrival}>{transit.arrival}</Text></View>;
}

function TrafficOverview() {
  return <View style={styles.overviewCard}><View style={styles.overviewHeader}><View><Text style={styles.overline}>NEW YORK CITY · SIMULATED</Text><Text style={styles.overviewLevel}>Moderate traffic</Text></View><View style={styles.overviewIndicator}><View style={styles.overviewIndicatorFill} /></View></View><View style={styles.overviewStats}><OverviewStat label="AVG SPEED" value="18 mph" /><OverviewStat label="INCIDENTS" value="4 major" /><OverviewStat label="AVG DELAY" value="+11 min" /></View></View>;
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return <View style={styles.overviewStat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.overviewValue}>{value}</Text></View>;
}

function DestinationResults({ results, query, onSelect }: { results: Destination[]; query: string; onSelect: (destination: Destination) => void }) {
  return <View style={styles.searchResults}><Text style={styles.sectionTitle}>Destinations</Text>{results.length === 0 ? <EmptyState title={`No matches for “${query}”`} copy="Try Home, Work, Gym, restaurant, or museum." /> : <View style={styles.listCard}>{results.map((place, index) => <View key={place.id}><Pressable onPress={() => onSelect(place)} style={({ pressed }) => [styles.destinationRow, pressed && styles.cardPressed]}><View style={styles.placeIcon}><Text style={styles.placeIconText}>{place.icon}</Text></View><View style={styles.destinationCopy}><Text style={styles.placeName}>{place.name}</Text><Text style={styles.placeAddress}>{place.address}</Text></View><Text style={styles.chevron}>›</Text></Pressable>{index < results.length - 1 && <View style={styles.historyDivider} />}</View>)}</View>}</View>;
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
  profileButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#233044', borderWidth: 1, borderColor: '#3A4B62', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: '#ECF2F8', fontSize: 12, fontWeight: '900' },
  layersButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#171D25', borderWidth: 1, borderColor: '#29333E', alignItems: 'center', justifyContent: 'center' },
  layersIcon: { color: '#69E08C', fontSize: 17, fontWeight: '900' },
  searchBar: { height: 54, borderRadius: 16, backgroundColor: '#171C23', borderWidth: 1, borderColor: '#29313B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchIcon: { color: '#A2ACB8', fontSize: 27, marginRight: 10, marginTop: -4 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: 0 },
  clearIcon: { color: '#AAB3BE', fontSize: 25, paddingLeft: 10 },
  shortcuts: { flexDirection: 'row', gap: 9, marginTop: 11, marginBottom: 24 },
  shortcutButton: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#171D24', borderWidth: 1, borderColor: '#29323C', borderRadius: 18, paddingHorizontal: 13 },
  shortcutActive: { borderColor: '#69E08C', backgroundColor: 'rgba(105,224,140,0.09)' },
  shortcutIcon: { color: '#69E08C', fontSize: 10, fontWeight: '900' },
  shortcutText: { color: '#C2CAD2', fontSize: 11, fontWeight: '800' },
  mapCard: { width: '100%', height: 390, borderRadius: 22, backgroundColor: '#151C22', borderWidth: 1, borderColor: '#30404B', overflow: 'hidden', marginBottom: 14 },
  mapGlow: { position: 'absolute', width: 430, height: 430, borderRadius: 215, right: -180, top: -170, backgroundColor: '#1F4B45', opacity: 0.24 },
  mapRoad: { position: 'absolute', height: 18, borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#2B353D', backgroundColor: '#20282F' },
  routeSegment: { position: 'absolute', height: 7, borderRadius: 4, transform: [{ rotate: '-19deg' }] },
  routeGreen: { backgroundColor: '#69E08C', width: '28%', left: '18%', top: '68%' },
  routeYellow: { backgroundColor: '#E0B24F', width: '24%', left: '40%', top: '52%' },
  routeRed: { backgroundColor: '#EB626C', width: '22%', left: '60%', top: '36%' },
  alternateRoute: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#607384', opacity: 0.75, width: '65%', left: '20%', top: '47%', transform: [{ rotate: '17deg' }] },
  roadLabel: { position: 'absolute', color: '#53606B', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  currentMarker: { position: 'absolute', left: '17%', top: '70%', width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(71,146,236,0.24)', alignItems: 'center', justifyContent: 'center' },
  currentMarkerCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5798E8', borderWidth: 2, borderColor: '#D8EAFF' },
  destinationMarker: { position: 'absolute', right: '17%', top: '25%', width: 32, height: 38, borderRadius: 16, borderBottomRightRadius: 4, backgroundColor: '#69E08C', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  destinationMarkerText: { color: '#0A1510', fontSize: 11, fontWeight: '900', transform: [{ rotate: '-45deg' }] },
  mapLegend: { position: 'absolute', left: 13, bottom: 13, height: 32, borderRadius: 10, backgroundColor: 'rgba(10,14,18,0.84)', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine: { width: 13, height: 3, borderRadius: 2 },
  legendText: { color: '#929DA8', fontSize: 8, fontWeight: '700' },
  zoomControls: { position: 'absolute', right: 13, top: 13, width: 36, backgroundColor: 'rgba(10,14,18,0.88)', borderRadius: 11, overflow: 'hidden' },
  zoomButton: { width: 36, height: 35, alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#E8EDF2', fontSize: 19, fontWeight: '700' },
  zoomDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#35404A' },
  recenterButton: { position: 'absolute', right: 13, bottom: 13, width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(10,14,18,0.88)', alignItems: 'center', justifyContent: 'center' },
  recenterIcon: { color: '#69E08C', fontSize: 18, fontWeight: '900' },
  mapBadge: { position: 'absolute', left: 13, top: 13, color: '#75828D', backgroundColor: 'rgba(10,14,18,0.84)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  routeCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 21, marginBottom: 52 },
  routeTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  overline: { color: '#75818D', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  routeDestination: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 5 },
  routeName: { color: '#7F8A96', fontSize: 11, marginTop: 5, maxWidth: 560 },
  routeTimeBlock: { alignItems: 'flex-end' },
  routeTime: { color: '#69E08C', fontSize: 25, fontWeight: '900' },
  trafficCondition: { color: '#8B96A1', fontSize: 10, marginTop: 4 },
  routeStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#303A44', marginTop: 18, paddingTop: 16 },
  statLabel: { color: '#6F7B87', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  statValue: { color: '#DDE3E9', fontSize: 12, fontWeight: '800', marginTop: 5 },
  startButton: { backgroundColor: '#69E08C', borderRadius: 18, alignItems: 'center', justifyContent: 'center', height: 42, marginTop: 19 },
  startedButton: { backgroundColor: 'rgba(105,224,140,0.13)', borderWidth: 1, borderColor: '#69E08C' },
  startText: { color: '#09140E', fontSize: 12, fontWeight: '900' },
  startedText: { color: '#69E08C' },
  startedNote: { color: '#6F7B87', fontSize: 9, textAlign: 'center', marginTop: 8 },
  section: { marginBottom: 52 },
  sectionLast: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 23, fontWeight: '900', letterSpacing: -0.45 },
  seeAll: { color: '#69E08C', fontSize: 13, fontWeight: '800' },
  modeRow: { gap: 10, paddingRight: 24 },
  modeButton: { width: 118, height: 52, borderRadius: 16, backgroundColor: '#151B22', borderWidth: 1, borderColor: '#29333D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  modeActive: { backgroundColor: '#69E08C', borderColor: '#69E08C' },
  modeIcon: { color: '#87929E', fontSize: 12, fontWeight: '900' },
  modeText: { color: '#A0AAB5', fontSize: 12, fontWeight: '800' },
  modeTextActive: { color: '#0A1510' },
  horizontalCards: { gap: 16, paddingRight: 28, paddingBottom: 2 },
  placeCard: { width: 224, height: 166, backgroundColor: '#151A21', borderWidth: 1, borderColor: '#29323C', borderRadius: 17, padding: 15 },
  placeCardSelected: { borderColor: '#69E08C' },
  placeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#25313C', alignItems: 'center', justifyContent: 'center' },
  placeIconText: { color: '#69E08C', fontSize: 11, fontWeight: '900' },
  placeTime: { color: '#69E08C', fontSize: 13, fontWeight: '900' },
  placeName: { color: '#F1F4F7', fontSize: 14, fontWeight: '900', marginTop: 15 },
  placeAddress: { color: '#77828E', fontSize: 10, marginTop: 5 },
  placeFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  conditionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69E08C' },
  conditionModerate: { backgroundColor: '#E0B24F' },
  conditionHeavy: { backgroundColor: '#EB626C' },
  placeCondition: { color: '#8D97A2', fontSize: 9, fontWeight: '700' },
  listCard: { backgroundColor: '#141920', borderWidth: 1, borderColor: '#28313B', borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  incidentRow: { minHeight: 98, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  incidentIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(224,178,79,0.12)', alignItems: 'center', justifyContent: 'center' },
  highBackground: { backgroundColor: 'rgba(232,136,67,0.13)' },
  severeBackground: { backgroundColor: 'rgba(235,98,108,0.13)' },
  incidentIconText: { color: '#E0B24F', fontSize: 17, fontWeight: '900' },
  severeText: { color: '#EB626C' },
  incidentCopy: { flex: 1, minWidth: 0 },
  incidentRoad: { color: '#EFF2F6', fontSize: 13, fontWeight: '900' },
  incidentDescription: { color: '#8A95A0', fontSize: 11, lineHeight: 15, marginTop: 4 },
  incidentDistance: { color: '#626E7A', fontSize: 9, marginTop: 5 },
  incidentRight: { alignItems: 'flex-end', minWidth: 58 },
  severityBadge: { color: '#D0A347', backgroundColor: 'rgba(224,178,79,0.12)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  severityHigh: { color: '#E88843', backgroundColor: 'rgba(232,136,67,0.12)' },
  severitySevere: { color: '#EB626C', backgroundColor: 'rgba(235,98,108,0.12)' },
  delayText: { color: '#A4ADB7', fontSize: 10, fontWeight: '800', marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 54 },
  transitRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 },
  transitLine: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  transitLineText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  transitCopy: { flex: 1, minWidth: 0 },
  transitStation: { color: '#EFF2F6', fontSize: 13, fontWeight: '800' },
  transitStatus: { color: '#69E08C', fontSize: 10, marginTop: 4 },
  transitArrival: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  transitDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 50 },
  simulatedLabel: { color: '#626E7A', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 9, textAlign: 'right' },
  historyRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11 },
  historyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#25313C', alignItems: 'center', justifyContent: 'center' },
  historyIconText: { color: '#69E08C', fontSize: 11, fontWeight: '900' },
  historyCopy: { flex: 1, minWidth: 0 },
  historyDestination: { color: '#EEF2F6', fontSize: 13, fontWeight: '900' },
  historyMeta: { color: '#737F8B', fontSize: 10, marginTop: 4 },
  historyTime: { color: '#DCE2E8', fontSize: 12, fontWeight: '800' },
  chevron: { color: '#65717D', fontSize: 22 },
  historyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#29313A', marginLeft: 49 },
  overviewCard: { backgroundColor: '#141A21', borderWidth: 1, borderColor: '#2D3742', borderRadius: 20, padding: 21 },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overviewLevel: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 7 },
  overviewIndicator: { width: 78, height: 8, borderRadius: 4, backgroundColor: '#2D3741', overflow: 'hidden' },
  overviewIndicatorFill: { width: '62%', height: 8, borderRadius: 4, backgroundColor: '#E0B24F' },
  overviewStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  overviewStat: { flex: 1, minWidth: 92, backgroundColor: '#1B222A', borderRadius: 13, padding: 13 },
  overviewValue: { color: '#E6EBF0', fontSize: 14, fontWeight: '900', marginTop: 6 },
  disclaimer: { color: '#697581', fontSize: 10, lineHeight: 15, textAlign: 'center', maxWidth: 620, alignSelf: 'center', marginBottom: 12 },
  searchResults: { minHeight: 360 },
  destinationRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11 },
  destinationCopy: { flex: 1, minWidth: 0 },
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
