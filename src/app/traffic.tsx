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
type HubMode = 'Road' | 'Flights';
type FlightStatus = 'On Time' | 'Delayed' | 'Boarding' | 'Landed';

type AirportWeather = {
  temperature: string;
  condition: string;
  precipitation: string;
  wind: string;
};

type Flight = {
  id: string;
  airline: string;
  number: string;
  origin: { code: string; city: string; weather: AirportWeather };
  destination: { code: string; city: string; weather: AirportWeather };
  departure: string;
  arrival: string;
  terminal: string;
  gate: string;
  duration: string;
  status: FlightStatus;
  timezoneDifference: string;
  delayLevel: string;
  destinationDrive: string;
  packingSuggestion: string;
  clothing: string[];
  reminder?: string;
};

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

const FLIGHTS: Flight[] = [
  { id: 'dl2451', airline: 'Delta Air Lines', number: 'DL2451', origin: { code: 'JFK', city: 'New York', weather: { temperature: '72°', condition: 'Partly cloudy', precipitation: '20%', wind: 'SW 9 mph' } }, destination: { code: 'MIA', city: 'Miami', weather: { temperature: '86°', condition: 'Warm and sunny', precipitation: '10%', wind: 'E 12 mph' } }, departure: '2:35 PM', arrival: '5:48 PM', terminal: '4', gate: 'B31', duration: '3h 13m', status: 'On Time', timezoneDifference: 'Same time zone', delayLevel: 'Low', destinationDrive: '24 min to downtown', packingSuggestion: 'Light layers and breathable shoes', clothing: ['Tops', 'Shoes', 'Accessories'] },
  { id: 'aa118', airline: 'American Airlines', number: 'AA118', origin: { code: 'JFK', city: 'New York', weather: { temperature: '72°', condition: 'Partly cloudy', precipitation: '20%', wind: 'SW 9 mph' } }, destination: { code: 'LHR', city: 'London', weather: { temperature: '58°', condition: 'Light rain', precipitation: '70%', wind: 'W 14 mph' } }, departure: '6:20 PM', arrival: '6:30 AM', terminal: '8', gate: '12', duration: '7h 10m', status: 'Boarding', timezoneDifference: '+5 hours', delayLevel: 'Moderate', destinationDrive: '45 min to central London', packingSuggestion: 'Waterproof jacket and umbrella', clothing: ['Outerwear', 'Bottoms', 'Shoes'], reminder: 'Umbrella recommended' },
  { id: 'ua205', airline: 'United Airlines', number: 'UA205', origin: { code: 'EWR', city: 'Newark', weather: { temperature: '70°', condition: 'Cloudy', precipitation: '25%', wind: 'W 11 mph' } }, destination: { code: 'SFO', city: 'San Francisco', weather: { temperature: '62°', condition: 'Cool and breezy', precipitation: '15%', wind: 'W 18 mph' } }, departure: '9:10 AM', arrival: '12:24 PM', terminal: 'C', gate: 'C74', duration: '6h 14m', status: 'Delayed', timezoneDifference: '-3 hours', delayLevel: 'High', destinationDrive: '32 min to downtown', packingSuggestion: 'Layered top, light coat, and closed-toe shoes', clothing: ['Outerwear', 'Tops', 'Shoes'], reminder: 'Light coat recommended' },
  { id: 'b61204', airline: 'JetBlue', number: 'B61204', origin: { code: 'JFK', city: 'New York', weather: { temperature: '72°', condition: 'Partly cloudy', precipitation: '20%', wind: 'SW 9 mph' } }, destination: { code: 'BOS', city: 'Boston', weather: { temperature: '66°', condition: 'Clear', precipitation: '5%', wind: 'NW 8 mph' } }, departure: '7:05 AM', arrival: '8:19 AM', terminal: '5', gate: '22', duration: '1h 14m', status: 'Landed', timezoneDifference: 'Same time zone', delayLevel: 'Low', destinationDrive: '18 min to downtown', packingSuggestion: 'Comfortable layers and walking shoes', clothing: ['Tops', 'Bottoms', 'Shoes'] },
];

export default function TrafficScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [hubMode, setHubMode] = useState<HubMode>('Road');
  const [selectedDestination, setSelectedDestination] = useState<Destination>(DESTINATIONS[1]);
  const [mode, setMode] = useState<TravelMode>('Drive');
  const [query, setQuery] = useState('');
  const [routeStarted, setRouteStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flightQuery, setFlightQuery] = useState('');
  const [submittedFlightQuery, setSubmittedFlightQuery] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [savedFlightIds, setSavedFlightIds] = useState<string[]>(['dl2451', 'aa118', 'ua205']);
  const [recentFlightSearches, setRecentFlightSearches] = useState<string[]>(['DL2451', 'AA118']);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 520);
    return () => clearTimeout(timer);
  }, []);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? DESTINATIONS.filter((place) => `${place.name} ${place.address}`.toLowerCase().includes(normalized)) : [];
  }, [query]);
  const flightResults = useMemo(() => {
    const normalized = submittedFlightQuery.trim().toLowerCase();
    return normalized
      ? FLIGHTS.filter((flight) => `${flight.airline} ${flight.number} ${flight.origin.code} ${flight.origin.city} ${flight.destination.code} ${flight.destination.city}`.toLowerCase().includes(normalized))
      : FLIGHTS;
  }, [submittedFlightQuery]);
  const savedFlights = useMemo(() => FLIGHTS.filter((flight) => savedFlightIds.includes(flight.id)), [savedFlightIds]);

  const selectDestination = (destination: Destination) => {
    setSelectedDestination(destination);
    setRouteStarted(false);
    setQuery('');
  };

  const selectMode = (nextMode: TravelMode) => {
    setMode(nextMode);
    setRouteStarted(false);
  };
  const selectHubMode = (nextMode: HubMode) => {
    setHubMode(nextMode);
    if (nextMode === 'Flights') {
      setFlightsLoading(true);
      setTimeout(() => setFlightsLoading(false), 420);
    }
  };
  const searchFlights = (value = flightQuery) => {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'DEMOERROR') {
      setFlightError('Unable to load simulated flight information.');
      return;
    }
    setFlightError(null);
    setFlightQuery(normalized);
    setSubmittedFlightQuery(normalized);
    if (normalized) setRecentFlightSearches((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 4));
    const match = FLIGHTS.find((flight) => flight.number === normalized);
    if (match) setSelectedFlight(match);
  };
  const toggleSavedFlight = (flightId: string) => setSavedFlightIds((current) => current.includes(flightId) ? current.filter((id) => id !== flightId) : [...current, flightId]);

  if (isLoading) return <ScreenState loading title="Loading your commute" copy="Preparing simulated route information…" />;
  if (error) return <ScreenState title="Traffic is unavailable" copy={error} action="Try again" onAction={() => { setError(null); setIsLoading(true); setTimeout(() => setIsLoading(false), 450); }} />;

  const route = selectedDestination.modes[mode];

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) + 28, paddingHorizontal: isDesktop ? 32 : 20, paddingBottom: insets.bottom + 140 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>YOUR COMMUTE HUB</Text><Text style={styles.title}>Traffic</Text><Text style={styles.subtitle}>Know before you go.</Text></View>
        <View style={styles.headerActions}><Pressable accessibilityLabel="Open profile" onPress={() => Alert.alert('Profile', 'LookUP profile controls are coming soon.')} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text style={styles.profileText}>LU</Text></Pressable><Pressable accessibilityLabel="Map layers" onPress={() => Alert.alert('Map layers', 'More simulated map layers are coming soon.')} style={({ pressed }) => [styles.layersButton, pressed && styles.pressed]}><Text style={styles.layersIcon}>▱</Text></Pressable></View>
      </View>

      <View style={styles.hubSelector}>
        {(['Road', 'Flights'] as HubMode[]).map((item) => (
          <Pressable key={item} onPress={() => selectHubMode(item)} style={[styles.hubModeButton, hubMode === item && styles.hubModeButtonActive]}>
            <Text style={[styles.hubModeText, hubMode === item && styles.hubModeTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {hubMode === 'Road' ? <>
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
      </> : (
        <FlightsExperience
          error={flightError}
          isDesktop={isDesktop}
          loading={flightsLoading}
          onRetry={() => { setFlightError(null); setFlightsLoading(true); setTimeout(() => setFlightsLoading(false), 420); }}
          onSearch={searchFlights}
          onSelectFlight={setSelectedFlight}
          onToggleSaved={toggleSavedFlight}
          query={flightQuery}
          recentSearches={recentFlightSearches}
          results={flightResults}
          savedFlightIds={savedFlightIds}
          savedFlights={savedFlights}
          selectedFlight={selectedFlight}
          setQuery={setFlightQuery}
        />
      )}
    </ScrollView>
  );
}

function FlightsExperience({
  error,
  isDesktop,
  loading,
  onRetry,
  onSearch,
  onSelectFlight,
  onToggleSaved,
  query,
  recentSearches,
  results,
  savedFlightIds,
  savedFlights,
  selectedFlight,
  setQuery,
}: {
  error: string | null;
  isDesktop: boolean;
  loading: boolean;
  onRetry: () => void;
  onSearch: (value?: string) => void;
  onSelectFlight: (flight: Flight) => void;
  onToggleSaved: (flightId: string) => void;
  query: string;
  recentSearches: string[];
  results: Flight[];
  savedFlightIds: string[];
  savedFlights: Flight[];
  selectedFlight: Flight | null;
  setQuery: (value: string) => void;
}) {
  if (loading) return <FlightState loading title="Loading simulated flights" copy="Preparing local schedule and airport weather data…" />;
  if (error) return <FlightState title="Flights are unavailable" copy={error} action="Retry" onAction={onRetry} />;

  return (
    <View>
      <View style={styles.flightIntro}><Text style={styles.flightEyebrow}>SIMULATED FLIGHT INFORMATION</Text><Text style={styles.flightTitle}>Flights</Text><Text style={styles.flightSubtitle}>Track a route and preview the journey ahead.</Text></View>
      <View style={styles.flightSearchRow}>
        <View style={[styles.searchBar, styles.flightSearchBar]}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Search flight number" autoCapitalize="characters" autoCorrect={false} onChangeText={setQuery} onSubmitEditing={() => onSearch()} placeholder="Search flight number" placeholderTextColor="#7E8793" returnKeyType="search" style={styles.searchInput} value={query} /></View>
        <Pressable onPress={() => onSearch()} style={({ pressed }) => [styles.flightSearchButton, pressed && styles.pressed]}><Text style={styles.flightSearchButtonText}>Search</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFlights}>
        {['DL2451', 'AA118', 'UA205', 'B61204'].map((number) => <Pressable key={number} onPress={() => onSearch(number)} style={({ pressed }) => [styles.quickFlightPill, pressed && styles.pressed]}><Text style={styles.quickFlightText}>{number}</Text></Pressable>)}
      </ScrollView>

      <View style={styles.section}>
        <SectionHeader title="Flight Results" />
        {results.length === 0 ? <EmptyState title={`No flights found for “${query}”`} copy="Try an airline, flight number, origin, or destination." /> : (
          <View style={styles.flightList}>
            {results.map((flight) => <FlightCard favorite={savedFlightIds.includes(flight.id)} flight={flight} isDesktop={isDesktop} key={flight.id} onPress={() => onSelectFlight(flight)} onToggleSaved={() => onToggleSaved(flight.id)} selected={selectedFlight?.id === flight.id} />)}
          </View>
        )}
      </View>

      {selectedFlight && <TravelSnapshot flight={selectedFlight} />}

      <View style={styles.section}>
        <SectionHeader title="Saved Flights" />
        {savedFlights.length === 0 ? <EmptyState title="No saved flights" copy="Use the bookmark on a flight to keep it nearby." /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedFlightRow}>
            {savedFlights.map((flight) => <SavedFlightCard flight={flight} key={flight.id} onPress={() => onSelectFlight(flight)} onToggleSaved={() => onToggleSaved(flight.id)} />)}
          </ScrollView>
        )}
      </View>

      <View style={styles.sectionLast}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        <View style={styles.recentSearchCard}>
          {recentSearches.map((item, index) => <View key={item}><Pressable onPress={() => onSearch(item)} style={({ pressed }) => [styles.recentSearchRow, pressed && styles.cardPressed]}><Text style={styles.recentSearchIcon}>↗</Text><Text style={styles.recentSearchText}>{item}</Text><Text style={styles.chevron}>›</Text></Pressable>{index < recentSearches.length - 1 && <View style={styles.recentSearchDivider} />}</View>)}
        </View>
      </View>
      <Text style={styles.disclaimer}>Flight schedules, statuses, airport delays, and weather shown in this MVP are simulated.</Text>
    </View>
  );
}

function FlightCard({ flight, favorite, isDesktop, onPress, onToggleSaved, selected }: { flight: Flight; favorite: boolean; isDesktop: boolean; onPress: () => void; onToggleSaved: () => void; selected: boolean }) {
  return (
    <View style={[styles.flightCard, selected && styles.flightCardSelected]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.flightCardMain, pressed && styles.cardPressed]}>
        <View style={styles.flightCardHeader}><View><Text style={styles.flightAirline}>{flight.airline}</Text><Text style={styles.flightNumber}>{flight.number} · SIMULATED</Text></View><StatusBadge status={flight.status} /></View>
        <View style={styles.flightRoute}><AirportPoint code={flight.origin.code} city={flight.origin.city} time={flight.departure} /><View style={styles.flightPath}><View style={styles.flightPathLine} /><Text style={styles.flightPathIcon}>✈</Text><Text style={styles.flightDuration}>{flight.duration}</Text></View><AirportPoint code={flight.destination.code} city={flight.destination.city} time={flight.arrival} right /></View>
        <View style={styles.flightMeta}><FlightMeta label="TERMINAL" value={flight.terminal} /><FlightMeta label="GATE" value={flight.gate} /><FlightMeta label="DEPARTS" value={flight.departure} /><FlightMeta label="ARRIVES" value={flight.arrival} /></View>
        <View style={[styles.airportWeatherRow, !isDesktop && styles.airportWeatherRowMobile]}><AirportWeatherCard label="Departure" airport={flight.origin.code} weather={flight.origin.weather} /><AirportWeatherCard label="Destination" airport={flight.destination.code} weather={flight.destination.weather} /></View>
      </Pressable>
      <Pressable accessibilityLabel={`${favorite ? 'Remove' : 'Save'} ${flight.number}`} onPress={onToggleSaved} style={({ pressed }) => [styles.flightBookmark, favorite && styles.flightBookmarkActive, pressed && styles.pressed]}><Text style={[styles.flightBookmarkText, favorite && styles.flightBookmarkTextActive]}>{favorite ? '★' : '☆'}</Text></Pressable>
    </View>
  );
}

function StatusBadge({ status }: { status: FlightStatus }) {
  return <View style={[styles.flightStatus, status === 'Delayed' && styles.flightStatusDelayed, status === 'Boarding' && styles.flightStatusBoarding]}><Text style={[styles.flightStatusText, status === 'Delayed' && styles.flightStatusTextDelayed, status === 'Boarding' && styles.flightStatusTextBoarding]}>{status}</Text></View>;
}

function AirportPoint({ code, city, time, right = false }: { code: string; city: string; time: string; right?: boolean }) {
  return <View style={[styles.airportPoint, right && styles.airportPointRight]}><Text style={styles.airportCode}>{code}</Text><Text numberOfLines={1} style={styles.airportCity}>{city}</Text><Text style={styles.airportTime}>{time}</Text></View>;
}

function FlightMeta({ label, value }: { label: string; value: string }) {
  return <View style={styles.flightMetaItem}><Text style={styles.flightMetaLabel}>{label}</Text><Text style={styles.flightMetaValue}>{value}</Text></View>;
}

function AirportWeatherCard({ airport, label, weather }: { airport: string; label: string; weather: AirportWeather }) {
  return <View style={styles.airportWeatherCard}><View style={styles.airportWeatherTop}><Text style={styles.airportWeatherLabel}>{label} · {airport}</Text><Text style={styles.airportWeatherTemp}>{weather.temperature}</Text></View><Text style={styles.airportWeatherCondition}>{weather.condition}</Text><Text style={styles.airportWeatherDetails}>Rain {weather.precipitation} · Wind {weather.wind}</Text></View>;
}

function TravelSnapshot({ flight }: { flight: Flight }) {
  return (
    <View style={styles.snapshotSection}>
      <Text style={styles.sectionTitle}>Travel Snapshot</Text>
      <View style={styles.snapshotCard}>
        <View style={styles.snapshotHeader}><View><Text style={styles.snapshotRoute}>{flight.origin.code} → {flight.destination.code}</Text><Text style={styles.snapshotArrival}>Arrive {flight.arrival} local · {flight.timezoneDifference}</Text></View><StatusBadge status={flight.status} /></View>
        <View style={styles.snapshotGrid}>
          <SnapshotItem label="DESTINATION WEATHER" value={`${flight.destination.weather.temperature} · ${flight.destination.weather.condition}`} />
          <SnapshotItem label="AIRPORT DELAYS" value={`${flight.delayLevel} simulated delay level`} />
          <SnapshotItem label="DESTINATION DRIVE" value={flight.destinationDrive} />
          <SnapshotItem label="PACKING SUGGESTION" value={flight.packingSuggestion} />
        </View>
        <View style={styles.clothingRecommendation}><Text style={styles.clothingRecommendationLabel}>RECOMMENDED CLOTHING</Text><View style={styles.clothingPills}>{flight.clothing.map((item) => <View key={item} style={styles.clothingPill}><Text style={styles.clothingPillText}>{item}</Text></View>)}</View>{flight.reminder && <Text style={styles.travelReminder}>{flight.reminder}</Text>}</View>
        <View style={styles.snapshotActions}>
          <Pressable onPress={() => Alert.alert('Destination traffic', `Showing a local preview for ${flight.destination.city}.`)} style={({ pressed }) => [styles.snapshotAction, pressed && styles.pressed]}><Text style={styles.snapshotActionText}>View destination traffic</Text></Pressable>
          <Pressable onPress={() => Alert.alert('My Locker', 'Packing-list integration with My Locker is coming soon.')} style={({ pressed }) => [styles.snapshotAction, pressed && styles.pressed]}><Text style={styles.snapshotActionText}>Build packing list</Text></Pressable>
          <Pressable onPress={() => Alert.alert(`${flight.destination.city} weather`, `${flight.destination.weather.temperature} · ${flight.destination.weather.condition} · Rain ${flight.destination.weather.precipitation}`)} style={({ pressed }) => [styles.snapshotAction, pressed && styles.pressed]}><Text style={styles.snapshotActionText}>Check weather details</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return <View style={styles.snapshotItem}><Text style={styles.snapshotItemLabel}>{label}</Text><Text style={styles.snapshotItemValue}>{value}</Text></View>;
}

function SavedFlightCard({ flight, onPress, onToggleSaved }: { flight: Flight; onPress: () => void; onToggleSaved: () => void }) {
  return <View style={styles.savedFlightCard}><Pressable onPress={onPress} style={({ pressed }) => [styles.savedFlightMain, pressed && styles.cardPressed]}><Text style={styles.savedFlightNumber}>{flight.number}</Text><Text style={styles.savedFlightAirline}>{flight.airline}</Text><Text style={styles.savedFlightRoute}>{flight.origin.code} → {flight.destination.code}</Text><StatusBadge status={flight.status} /></Pressable><Pressable accessibilityLabel={`Remove ${flight.number} from saved flights`} onPress={onToggleSaved} style={styles.savedFlightRemove}><Text style={styles.savedFlightRemoveText}>★</Text></Pressable></View>;
}

function FlightState({ title, copy, loading = false, action, onAction }: { title: string; copy: string; loading?: boolean; action?: string; onAction?: () => void }) {
  return <View style={styles.flightState}>{loading ? <ActivityIndicator color="#69E08C" size="large" /> : <Text style={styles.stateMark}>!</Text>}<Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateCopy}>{copy}</Text>{action && onAction ? <Pressable onPress={onAction} style={styles.retryButton}><Text style={styles.retryText}>{action}</Text></Pressable> : null}</View>;
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
  hubSelector: { alignSelf: 'flex-start', backgroundColor: '#12171D', borderColor: '#27313A', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 5, marginBottom: 24, padding: 4 },
  hubModeButton: { alignItems: 'center', borderRadius: 16, justifyContent: 'center', minHeight: 36, minWidth: 104, paddingHorizontal: 18 },
  hubModeButtonActive: { backgroundColor: '#69E08C' },
  hubModeText: { color: '#8E99A4', fontSize: 12, fontWeight: '800' },
  hubModeTextActive: { color: '#08140D', fontWeight: '900' },
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
  flightIntro: { marginBottom: 20 },
  flightEyebrow: { color: '#69E08C', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  flightTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', letterSpacing: -0.8, marginTop: 7 },
  flightSubtitle: { color: '#818C97', fontSize: 13, marginTop: 6 },
  flightSearchRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  flightSearchBar: { flex: 1 },
  flightSearchButton: { alignItems: 'center', backgroundColor: '#69E08C', borderRadius: 16, height: 54, justifyContent: 'center', paddingHorizontal: 22 },
  flightSearchButtonText: { color: '#09140E', fontSize: 12, fontWeight: '900' },
  quickFlights: { gap: 8, paddingBottom: 30, paddingRight: 20, paddingTop: 11 },
  quickFlightPill: { backgroundColor: '#171D24', borderColor: '#29333D', borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  quickFlightText: { color: '#AEB7C0', fontSize: 10, fontWeight: '900' },
  flightList: { gap: 16 },
  flightCard: { backgroundColor: '#141A21', borderColor: '#2B3540', borderRadius: 22, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  flightCardSelected: { backgroundColor: '#142019', borderColor: '#69E08C' },
  flightCardMain: { padding: 22 },
  flightCardHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', paddingRight: 40 },
  flightAirline: { color: '#F0F4F7', fontSize: 16, fontWeight: '900' },
  flightNumber: { color: '#737F8B', fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginTop: 5 },
  flightStatus: { backgroundColor: 'rgba(105,224,140,0.12)', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6 },
  flightStatusDelayed: { backgroundColor: 'rgba(235,126,67,0.13)' },
  flightStatusBoarding: { backgroundColor: 'rgba(224,178,79,0.13)' },
  flightStatusText: { color: '#69E08C', fontSize: 9, fontWeight: '900' },
  flightStatusTextDelayed: { color: '#EB7E43' },
  flightStatusTextBoarding: { color: '#E0B24F' },
  flightRoute: { alignItems: 'center', flexDirection: 'row', marginTop: 25 },
  airportPoint: { flex: 1 },
  airportPointRight: { alignItems: 'flex-end' },
  airportCode: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  airportCity: { color: '#88939E', fontSize: 11, marginTop: 3, maxWidth: 160 },
  airportTime: { color: '#DCE2E7', fontSize: 12, fontWeight: '800', marginTop: 7 },
  flightPath: { alignItems: 'center', flex: 0.85, paddingHorizontal: 10 },
  flightPathLine: { backgroundColor: '#39454F', height: 1, position: 'absolute', top: 9, width: '100%' },
  flightPathIcon: { backgroundColor: '#141A21', color: '#69E08C', fontSize: 16, paddingHorizontal: 8 },
  flightDuration: { color: '#737F8B', fontSize: 9, fontWeight: '700', marginTop: 7 },
  flightMeta: { borderBottomColor: '#2B3540', borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: '#2B3540', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginTop: 22, paddingVertical: 15 },
  flightMetaItem: { minWidth: 70 },
  flightMetaLabel: { color: '#687480', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  flightMetaValue: { color: '#DCE2E8', fontSize: 12, fontWeight: '800', marginTop: 5 },
  airportWeatherRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  airportWeatherRowMobile: { flexDirection: 'column' },
  airportWeatherCard: { backgroundColor: '#1A2128', borderRadius: 14, flex: 1, padding: 13 },
  airportWeatherTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  airportWeatherLabel: { color: '#727E8A', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  airportWeatherTemp: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  airportWeatherCondition: { color: '#D3D9DF', fontSize: 11, fontWeight: '800', marginTop: 7 },
  airportWeatherDetails: { color: '#717D89', fontSize: 9, marginTop: 5 },
  flightBookmark: { alignItems: 'center', backgroundColor: '#202831', borderRadius: 15, height: 30, justifyContent: 'center', position: 'absolute', right: 18, top: 18, width: 30 },
  flightBookmarkActive: { backgroundColor: 'rgba(105,224,140,0.14)' },
  flightBookmarkText: { color: '#75818C', fontSize: 14 },
  flightBookmarkTextActive: { color: '#69E08C' },
  snapshotSection: { marginBottom: 52 },
  snapshotCard: { backgroundColor: '#111A15', borderColor: 'rgba(105,224,140,0.2)', borderRadius: 22, borderWidth: 1, marginTop: 16, padding: 21 },
  snapshotHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  snapshotRoute: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  snapshotArrival: { color: '#7F8B84', fontSize: 10, marginTop: 6 },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 19 },
  snapshotItem: { backgroundColor: '#172019', borderRadius: 14, flexBasis: 220, flexGrow: 1, padding: 14 },
  snapshotItemLabel: { color: '#6F7B73', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  snapshotItemValue: { color: '#E3E9E5', fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 6 },
  clothingRecommendation: { borderTopColor: 'rgba(255,255,255,0.07)', borderTopWidth: 1, marginTop: 17, paddingTop: 16 },
  clothingRecommendationLabel: { color: '#708078', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  clothingPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  clothingPill: { backgroundColor: 'rgba(105,224,140,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  clothingPillText: { color: '#A9E8BB', fontSize: 9, fontWeight: '800' },
  travelReminder: { color: '#E0B24F', fontSize: 10, fontWeight: '800', marginTop: 12 },
  snapshotActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  snapshotAction: { alignItems: 'center', borderColor: '#314038', borderRadius: 14, borderWidth: 1, flexGrow: 1, minWidth: 170, paddingHorizontal: 13, paddingVertical: 11 },
  snapshotActionText: { color: '#9EAAA3', fontSize: 10, fontWeight: '800' },
  savedFlightRow: { gap: 13, paddingBottom: 2, paddingRight: 24 },
  savedFlightCard: { backgroundColor: '#151B22', borderColor: '#29333D', borderRadius: 17, borderWidth: 1, height: 168, padding: 15, position: 'relative', width: 230 },
  savedFlightMain: { flex: 1 },
  savedFlightNumber: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  savedFlightAirline: { color: '#747F8B', fontSize: 9, marginTop: 4 },
  savedFlightRoute: { color: '#DDE3E8', fontSize: 19, fontWeight: '900', marginBottom: 13, marginTop: 15 },
  savedFlightRemove: { alignItems: 'center', height: 30, justifyContent: 'center', position: 'absolute', right: 9, top: 8, width: 30 },
  savedFlightRemoveText: { color: '#69E08C', fontSize: 14 },
  recentSearchCard: { backgroundColor: '#141920', borderColor: '#28313B', borderRadius: 17, borderWidth: 1, marginTop: 16, paddingHorizontal: 15 },
  recentSearchRow: { alignItems: 'center', flexDirection: 'row', minHeight: 54 },
  recentSearchIcon: { color: '#69E08C', fontSize: 13, marginRight: 11 },
  recentSearchText: { color: '#DCE2E8', flex: 1, fontSize: 12, fontWeight: '800' },
  recentSearchDivider: { backgroundColor: '#29313A', height: StyleSheet.hairlineWidth, marginLeft: 24 },
  flightState: { alignItems: 'center', backgroundColor: '#12181E', borderColor: '#28323B', borderRadius: 20, borderWidth: 1, justifyContent: 'center', minHeight: 330, padding: 30 },
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
