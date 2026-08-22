export type CommuteMode = 'driving' | 'subway' | 'bus' | 'walking' | 'flight' | 'other';
export type TrafficDataProvenance = 'live' | 'mock' | 'unavailable';
export type TravelMode = 'Drive' | 'Transit' | 'Walk' | 'Bike';
export type TrafficLevel = 'Light' | 'Normal' | 'Moderate' | 'Heavy';
export type DisruptionSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'severe';

export type DrivingCommute = {
  mode: 'driving';
  durationMinutes: number;
  usualMinutes: number;
  status: TrafficLevel;
};

export type SubwayServiceStatus = 'Good Service' | 'Minor Delays' | 'Delayed' | 'Major Delays' | 'Service Change';

export type SubwayCommute = {
  mode: 'subway';
  line: string;
  station: string;
  direction: string;
  nextArrivalMinutes: number;
  followingArrivalMinutes: number;
  status: SubwayServiceStatus;
  delayMinutes: number;
  serviceChanges?: string[];
  detour?: string;
};

export type CommuteData =
  | DrivingCommute
  | SubwayCommute
  | { mode: Exclude<CommuteMode, 'driving' | 'subway'>; durationMinutes?: number; status?: string };

export type RoadRouteOption = {
  time: string;
  estimatedTravelMinutes: number;
  distance: string;
  arrival: string;
  route: string;
  delayMinutes: number;
  alternateRoute?: string;
};

export type RoadDestination = {
  id: string;
  name: string;
  address: string;
  icon: string;
  condition: Exclude<TrafficLevel, 'Normal'>;
  modes: Record<TravelMode, RoadRouteOption>;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type RoadIncident = {
  id: string;
  icon: string;
  road: string;
  description: string;
  distance: string;
  severity: 'Low' | 'Medium' | 'High' | 'Severe';
  delay: string;
  delayMinutes: number;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type TransitArrival = SubwayCommute & {
  agency: string;
  scheduledArrival: string;
  estimatedArrival: string;
  cancelled: boolean;
  disruptionSeverity: DisruptionSeverity;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type TransitMode = 'Subway' | 'Bus' | 'Rail';

export type TransitService = {
  id: string;
  mode: TransitMode;
  agency: string;
  line: string;
  station: string;
  destination: string;
  scheduledArrival: string;
  estimatedArrival: string;
  status: SubwayServiceStatus;
  serviceAlert?: string;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type AirportWeather = { temperature: string; condition: string; precipitation: string; wind: string };
export type FlightStatus = 'On Time' | 'Delayed' | 'Boarding' | 'Landed' | 'Cancelled';

export type FlightData = {
  id: string;
  airline: string;
  number: string;
  origin: { code: string; city: string; weather: AirportWeather };
  destination: { code: string; city: string; weather: AirportWeather };
  scheduledDeparture: string;
  estimatedDeparture: string;
  scheduledArrival: string;
  estimatedArrival: string;
  departure: string;
  arrival: string;
  terminal?: string;
  gate?: string;
  duration: string;
  status: FlightStatus;
  delayMinutes: number;
  cancelled: boolean;
  timezoneDifference: string;
  delayLevel: string;
  destinationDrive: string;
  packingSuggestion: string;
  clothing: string[];
  reminder?: string;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type CruiseData = {
  id: string;
  cruiseLine: string;
  shipName: string;
  departurePort: string;
  itinerary: string;
  departureDateTime: string;
  status: 'Scheduled' | 'Delayed' | 'Boarding' | 'Departed' | 'Cancelled';
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type TrafficSummary = { commute: string; status: string; usualMinutes: number };

export type CommuteHistoryEntry = {
  id: string;
  destinationId: string;
  day: string;
  time: string;
  level: TrafficLevel;
  mode: TravelMode;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type TrafficOverview = {
  location: string;
  level: TrafficLevel;
  averageSpeed: string;
  majorIncidents: string;
  averageDelay: string;
  congestionPercent: number;
  dataProvider: string;
  provenance: 'live' | 'mock';
};

export type TrafficSnapshot = {
  commuteData: CommuteData;
  summary: TrafficSummary;
  roadDestinations: RoadDestination[];
  roadIncidents: RoadIncident[];
  subwayCommutes: TransitArrival[];
  transitServices: TransitService[];
  flights: FlightData[];
  cruises: CruiseData[];
  commuteHistory: CommuteHistoryEntry[];
  overview: TrafficOverview;
  dataProvider: string;
  provenance: 'live' | 'mock';
  updatedAt: string;
};

export type TrafficDataResult =
  | { data: TrafficSnapshot; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export interface TrafficDataProvider {
  readonly name: string;
  readonly provenance: 'live' | 'mock';
  getTraffic(): Promise<TrafficSnapshot>;
}

const MOCK_PROVIDER = 'LookUP local transportation fixtures';
const route = (time: string, estimatedTravelMinutes: number, distance: string, arrival: string, routeName: string, delayMinutes = 0, alternateRoute?: string): RoadRouteOption => ({ time, estimatedTravelMinutes, distance, arrival, route: routeName, delayMinutes, alternateRoute });

export const MOCK_ROAD_DESTINATIONS: RoadDestination[] = [
  { id: 'home', name: 'Home', address: '128 W 74th St, Manhattan', icon: 'H', condition: 'Moderate', dataProvider: MOCK_PROVIDER, provenance: 'mock', modes: { Drive: route('28 min', 28, '8.4 mi', '12:18 PM', 'FDR Drive via E 96th St', 4, 'Central Park West'), Transit: route('36 min', 36, '7 stops', '12:26 PM', '4 train to 2 train'), Walk: route('2 hr 18 min', 138, '6.7 mi', '2:08 PM', 'Lexington Ave to Central Park W'), Bike: route('46 min', 46, '7.2 mi', '12:36 PM', 'East River Greenway') } },
  { id: 'work', name: 'Work', address: '11 Madison Ave, Manhattan', icon: 'W', condition: 'Heavy', dataProvider: MOCK_PROVIDER, provenance: 'mock', modes: { Drive: route('34 min', 34, '7.8 mi', '12:24 PM', 'FDR Drive to E 23rd St', 10, 'Park Avenue southbound'), Transit: route('29 min', 29, '6 stops', '12:19 PM', '6 train to 23rd St'), Walk: route('1 hr 42 min', 102, '5.1 mi', '1:32 PM', 'Park Ave southbound'), Bike: route('39 min', 39, '5.8 mi', '12:29 PM', '2nd Ave bike lane') } },
  { id: 'gym', name: 'Gym', address: '250 Mercer St, Manhattan', icon: 'G', condition: 'Light', dataProvider: MOCK_PROVIDER, provenance: 'mock', modes: { Drive: route('22 min', 22, '5.9 mi', '12:12 PM', 'FDR Drive to Houston St'), Transit: route('31 min', 31, '5 stops', '12:21 PM', '6 train to Bleecker St'), Walk: route('1 hr 25 min', 85, '4.2 mi', '1:15 PM', 'Broadway southbound'), Bike: route('31 min', 31, '4.7 mi', '12:21 PM', 'Broadway protected lanes') } },
  { id: 'restaurant', name: 'Favorite Restaurant', address: '42 Grove St, West Village', icon: 'R', condition: 'Moderate', dataProvider: MOCK_PROVIDER, provenance: 'mock', modes: { Drive: route('31 min', 31, '6.3 mi', '12:21 PM', 'FDR Drive to Houston St', 5), Transit: route('38 min', 38, '8 stops', '12:28 PM', 'A train to W 4th St'), Walk: route('1 hr 51 min', 111, '5.5 mi', '1:41 PM', '5th Ave to Greenwich Ave'), Bike: route('37 min', 37, '5.4 mi', '12:27 PM', 'Hudson River Greenway') } },
  { id: 'museum', name: 'Metropolitan Museum', address: '1000 5th Ave, Manhattan', icon: 'M', condition: 'Light', dataProvider: MOCK_PROVIDER, provenance: 'mock', modes: { Drive: route('14 min', 14, '2.8 mi', '12:04 PM', '5th Ave northbound'), Transit: route('24 min', 24, '3 stops', '12:14 PM', '4 train to M86 bus'), Walk: route('43 min', 43, '2.1 mi', '12:33 PM', 'Madison Ave to E 82nd St'), Bike: route('18 min', 18, '2.4 mi', '12:08 PM', 'Central Park loop') } },
];

export const MOCK_ROAD_INCIDENTS: RoadIncident[] = [
  { id: 'accident', icon: '!', road: 'FDR Drive · E 71st St', description: 'Two-vehicle accident blocking the right lane', distance: '1.2 mi away', severity: 'High', delay: '+12 min', delayMinutes: 12, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'construction', icon: '◇', road: '2nd Ave · E 42nd St', description: 'Night construction with one lane restricted', distance: '2.8 mi away', severity: 'Medium', delay: '+6 min', delayMinutes: 6, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'closure', icon: '×', road: 'W 34th St · 7th Ave', description: 'Road closed for a scheduled public event', distance: '3.4 mi away', severity: 'Severe', delay: '+18 min', delayMinutes: 18, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'congestion', icon: '≈', road: 'Brooklyn Bridge', description: 'Heavy congestion approaching Manhattan', distance: '4.1 mi away', severity: 'Medium', delay: '+9 min', delayMinutes: 9, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

export const MOCK_SUBWAY_COMMUTES: TransitArrival[] = [
  { mode: 'subway', agency: 'MTA New York City Transit', line: '4', station: '86 St · Lexington Ave', direction: 'Downtown Manhattan', scheduledArrival: '3 min', estimatedArrival: '3 min', nextArrivalMinutes: 3, followingArrivalMinutes: 9, status: 'Good Service', delayMinutes: 0, cancelled: false, disruptionSeverity: 'none', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { mode: 'subway', agency: 'MTA New York City Transit', line: '6', station: '77 St · Lexington Ave', direction: 'Brooklyn Bridge', scheduledArrival: '7 min', estimatedArrival: '7 min', nextArrivalMinutes: 7, followingArrivalMinutes: 14, status: 'Good Service', delayMinutes: 0, cancelled: false, disruptionSeverity: 'none', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { mode: 'subway', agency: 'MTA New York City Transit', line: 'A', station: '72 St · Central Park West', direction: 'Downtown Manhattan', scheduledArrival: '4 min', estimatedArrival: '4 min', nextArrivalMinutes: 4, followingArrivalMinutes: 11, status: 'Good Service', delayMinutes: 0, cancelled: false, disruptionSeverity: 'none', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { mode: 'subway', agency: 'MTA New York City Transit', line: 'Q', station: '72 St · 2nd Ave', direction: 'Times Sq–42 St', scheduledArrival: '4 min', estimatedArrival: '9 min', nextArrivalMinutes: 9, followingArrivalMinutes: 17, status: 'Minor Delays', delayMinutes: 5, serviceChanges: ['Allow additional travel time.'], cancelled: false, disruptionSeverity: 'minor', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

export const MOCK_TRANSIT_SERVICES: TransitService[] = [
  { id: 'subway-4', mode: 'Subway', agency: 'MTA New York City Transit', line: '4', station: '86 St · Lexington Ave', destination: 'Downtown Manhattan', scheduledArrival: '3 min', estimatedArrival: '3 min', status: 'Good Service', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'subway-q', mode: 'Subway', agency: 'MTA New York City Transit', line: 'Q', station: '72 St · 2nd Ave', destination: 'Times Sq–42 St', scheduledArrival: '4 min', estimatedArrival: '9 min', status: 'Minor Delays', serviceAlert: 'Allow additional travel time.', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'bus-m15', mode: 'Bus', agency: 'MTA New York City Transit', line: 'M15 SBS', station: '2nd Ave · E 79th St', destination: 'South Ferry', scheduledArrival: '6 min', estimatedArrival: '8 min', status: 'Minor Delays', serviceAlert: 'Traffic is slowing southbound service.', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'bus-m86', mode: 'Bus', agency: 'MTA New York City Transit', line: 'M86 SBS', station: 'E 86th St · Lexington Ave', destination: 'West Side', scheduledArrival: '5 min', estimatedArrival: '5 min', status: 'Good Service', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'rail-harlem', mode: 'Rail', agency: 'Metro-North Railroad', line: 'Harlem', station: 'Grand Central', destination: 'White Plains', scheduledArrival: '4:22 PM', estimatedArrival: '4:22 PM', status: 'Good Service', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'rail-lirr', mode: 'Rail', agency: 'Long Island Rail Road', line: 'Port Washington', station: 'Penn Station', destination: 'Great Neck', scheduledArrival: '4:36 PM', estimatedArrival: '4:44 PM', status: 'Delayed', serviceAlert: 'Simulated eight-minute delay.', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

const weather = (temperature: string, condition: string, precipitation: string, wind: string): AirportWeather => ({ temperature, condition, precipitation, wind });
export const MOCK_FLIGHTS: FlightData[] = [
  { id: 'dl2451', airline: 'Delta Air Lines', number: 'DL2451', origin: { code: 'JFK', city: 'New York', weather: weather('72°', 'Partly cloudy', '20%', 'SW 9 mph') }, destination: { code: 'MIA', city: 'Miami', weather: weather('86°', 'Warm and sunny', '10%', 'E 12 mph') }, scheduledDeparture: '2:35 PM', estimatedDeparture: '2:35 PM', scheduledArrival: '5:48 PM', estimatedArrival: '5:48 PM', departure: '2:35 PM', arrival: '5:48 PM', terminal: '4', gate: 'B31', duration: '3h 13m', status: 'On Time', delayMinutes: 0, cancelled: false, timezoneDifference: 'Same time zone', delayLevel: 'Low', destinationDrive: '24 min to downtown', packingSuggestion: 'Light layers and breathable shoes', clothing: ['Tops', 'Shoes', 'Accessories'], dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'aa118', airline: 'American Airlines', number: 'AA118', origin: { code: 'JFK', city: 'New York', weather: weather('72°', 'Partly cloudy', '20%', 'SW 9 mph') }, destination: { code: 'LHR', city: 'London', weather: weather('58°', 'Light rain', '70%', 'W 14 mph') }, scheduledDeparture: '6:20 PM', estimatedDeparture: '6:20 PM', scheduledArrival: '6:30 AM', estimatedArrival: '6:30 AM', departure: '6:20 PM', arrival: '6:30 AM', terminal: '8', gate: '12', duration: '7h 10m', status: 'Boarding', delayMinutes: 0, cancelled: false, timezoneDifference: '+5 hours', delayLevel: 'Moderate', destinationDrive: '45 min to central London', packingSuggestion: 'Waterproof jacket and umbrella', clothing: ['Outerwear', 'Bottoms', 'Shoes'], reminder: 'Umbrella recommended', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'ua205', airline: 'United Airlines', number: 'UA205', origin: { code: 'EWR', city: 'Newark', weather: weather('70°', 'Cloudy', '25%', 'W 11 mph') }, destination: { code: 'SFO', city: 'San Francisco', weather: weather('62°', 'Cool and breezy', '15%', 'W 18 mph') }, scheduledDeparture: '9:10 AM', estimatedDeparture: '9:45 AM', scheduledArrival: '12:24 PM', estimatedArrival: '12:59 PM', departure: '9:10 AM', arrival: '12:24 PM', terminal: 'C', gate: 'C74', duration: '6h 14m', status: 'Delayed', delayMinutes: 35, cancelled: false, timezoneDifference: '-3 hours', delayLevel: 'High', destinationDrive: '32 min to downtown', packingSuggestion: 'Layered top, light coat, and closed-toe shoes', clothing: ['Outerwear', 'Tops', 'Shoes'], reminder: 'Light coat recommended', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'b61204', airline: 'JetBlue', number: 'B61204', origin: { code: 'JFK', city: 'New York', weather: weather('72°', 'Partly cloudy', '20%', 'SW 9 mph') }, destination: { code: 'BOS', city: 'Boston', weather: weather('66°', 'Clear', '5%', 'NW 8 mph') }, scheduledDeparture: '7:05 AM', estimatedDeparture: '7:05 AM', scheduledArrival: '8:19 AM', estimatedArrival: '8:19 AM', departure: '7:05 AM', arrival: '8:19 AM', terminal: '5', gate: '22', duration: '1h 14m', status: 'Landed', delayMinutes: 0, cancelled: false, timezoneDifference: 'Same time zone', delayLevel: 'Low', destinationDrive: '18 min to downtown', packingSuggestion: 'Comfortable layers and walking shoes', clothing: ['Tops', 'Bottoms', 'Shoes'], dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

export const MOCK_CRUISES: CruiseData[] = [
  { id: 'cruise-harbor-star', cruiseLine: 'LookUP Demo Cruise Line', shipName: 'Harbor Star', departurePort: 'Manhattan Cruise Terminal', itinerary: 'New York · Bermuda · New York', departureDateTime: 'Saturday · 4:00 PM', status: 'Scheduled', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'cruise-coastal-way', cruiseLine: 'LookUP Demo Voyages', shipName: 'Coastal Way', departurePort: 'Cape Liberty Cruise Port', itinerary: 'New Jersey · Halifax · Boston', departureDateTime: 'Next Friday · 3:30 PM', status: 'Scheduled', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

export const MOCK_COMMUTE_HISTORY: CommuteHistoryEntry[] = [
  { id: 'work-yesterday', destinationId: 'work', day: 'Yesterday', time: '31 min', level: 'Heavy', mode: 'Drive', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'gym-monday', destinationId: 'gym', day: 'Monday', time: '28 min', level: 'Light', mode: 'Bike', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'home-sunday', destinationId: 'home', day: 'Sunday', time: '35 min', level: 'Moderate', mode: 'Transit', dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

export const MOCK_TRAFFIC_OVERVIEW: TrafficOverview = {
  location: 'New York City',
  level: 'Moderate',
  averageSpeed: '18 mph',
  majorIncidents: '4 major',
  averageDelay: '+11 min',
  congestionPercent: 62,
  dataProvider: MOCK_PROVIDER,
  provenance: 'mock',
};

export const mockTrafficProvider: TrafficDataProvider = {
  name: MOCK_PROVIDER,
  provenance: 'mock',
  async getTraffic() {
    const commuteData: DrivingCommute = { mode: 'driving', durationMinutes: 28, usualMinutes: 28, status: 'Normal' };
    return {
      commuteData,
      summary: { commute: `${commuteData.durationMinutes} mins`, status: commuteData.status, usualMinutes: commuteData.usualMinutes },
      roadDestinations: MOCK_ROAD_DESTINATIONS,
      roadIncidents: MOCK_ROAD_INCIDENTS,
      subwayCommutes: MOCK_SUBWAY_COMMUTES,
      transitServices: MOCK_TRANSIT_SERVICES,
      flights: MOCK_FLIGHTS,
      cruises: MOCK_CRUISES,
      commuteHistory: MOCK_COMMUTE_HISTORY,
      overview: MOCK_TRAFFIC_OVERVIEW,
      dataProvider: MOCK_PROVIDER,
      provenance: 'mock',
      updatedAt: new Date().toISOString(),
    };
  },
};

export async function getTraffic(provider: TrafficDataProvider = mockTrafficProvider): Promise<TrafficDataResult> {
  try {
    const data = await provider.getTraffic();
    return {
      data: { ...data, dataProvider: provider.name, provenance: provider.provenance },
      error: null,
      provenance: provider.provenance,
    };
  } catch {
    return { data: null, error: 'Traffic information is currently unavailable.', provenance: 'unavailable' };
  }
}

function canUseTransportationData(result: TrafficDataResult, allowMock = false): result is Extract<TrafficDataResult, { data: TrafficSnapshot }> {
  return result.provenance === 'live' || (result.provenance === 'mock' && allowMock);
}

export function getRoadSummary(result: TrafficDataResult, options: { allowMock?: boolean } = {}): TrafficSummary | undefined {
  return canUseTransportationData(result, options.allowMock) ? result.data.summary : undefined;
}

export function getTrafficSummaryForIntelligence(result: TrafficDataResult, options: { allowMock?: boolean } = {}): TrafficSummary | undefined {
  return getRoadSummary(result, options);
}

export function getTransitArrivals(result: TrafficDataResult, options: { allowMock?: boolean } = {}): TransitArrival[] {
  return canUseTransportationData(result, options.allowMock) ? result.data.subwayCommutes : [];
}

export function getTransitSummary(result: TrafficDataResult, options: { allowMock?: boolean } = {}): TransitArrival | undefined {
  return getTransitArrivals(result, options)[0];
}

export function getServiceAlerts(result: TrafficDataResult, options: { allowMock?: boolean } = {}): TransitArrival[] {
  return getTransitArrivals(result, options).filter(
    (arrival) => arrival.cancelled || arrival.delayMinutes > 0 || arrival.status !== 'Good Service' || Boolean(arrival.serviceChanges?.length),
  );
}

export function getFlightSummary(result: TrafficDataResult, flightId?: string, options: { allowMock?: boolean } = {}): FlightData | undefined {
  if (!canUseTransportationData(result, options.allowMock)) return undefined;
  return flightId ? result.data.flights.find((flight) => flight.id === flightId) : result.data.flights[0];
}

export function searchFlights(flights: FlightData[], query: string): FlightData[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return flights;
  return flights.filter((flight) =>
    `${flight.airline} ${flight.number} ${flight.origin.code} ${flight.origin.city} ${flight.destination.code} ${flight.destination.city}`
      .toLowerCase()
      .includes(normalized),
  );
}
