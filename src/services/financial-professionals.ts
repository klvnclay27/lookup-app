import * as Location from 'expo-location';

import type { FinancialProfessionalDiscoveryContext, FinancialProfessionalProfile } from '@/services/finance';

export type ProfessionalSearchLocation = {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  postalCode?: string;
  source: 'device' | 'manual';
};

export type ProfessionalSearchRequest = {
  topic: Pick<FinancialProfessionalDiscoveryContext, 'topicId' | 'topicTitle'>;
  specialties: FinancialProfessionalDiscoveryContext['specialties'];
  location: ProfessionalSearchLocation;
  searchRadiusMiles: number;
};

export type ProfessionalSearchResult =
  | { data: FinancialProfessionalProfile[]; message: string; provenance: 'live'; provider: string }
  | { data: []; message: string; provenance: 'unavailable'; provider: string };

export interface ProfessionalSearchProvider {
  readonly name: string;
  search(request: ProfessionalSearchRequest): Promise<ProfessionalSearchResult>;
}

export type DeviceLocationRequestResult =
  | { status: 'granted'; location: ProfessionalSearchLocation }
  | { status: 'denied'; message: string }
  | { status: 'error'; message: string };

export const PROFESSIONAL_VERIFICATION_DESTINATIONS = [
  { id: 'sec-iapd', label: 'Verify with SEC/IAPD', url: 'https://adviserinfo.sec.gov/search/sec.go/' },
  { id: 'finra-brokercheck', label: 'Check FINRA BrokerCheck', url: 'https://brokercheck.finra.org/' },
  { id: 'cfp-board', label: 'Verify CFP® Certification', url: 'https://www.cfp.net/verify-a-cfp-professional' },
] as const;

export const unavailableProfessionalSearchProvider: ProfessionalSearchProvider = {
  name: 'No professional directory connected',
  async search() {
    return {
      data: [],
      message: 'Professional search is ready for verified data integration.',
      provenance: 'unavailable',
      provider: this.name,
    };
  },
};

export async function searchFinancialProfessionals(
  request: ProfessionalSearchRequest,
  provider: ProfessionalSearchProvider = unavailableProfessionalSearchProvider,
): Promise<ProfessionalSearchResult> {
  try {
    return await provider.search(request);
  } catch {
    return { data: [], message: 'Professional search is currently unavailable.', provenance: 'unavailable', provider: provider.name };
  }
}

export async function requestApproximateDeviceLocation(): Promise<DeviceLocationRequestResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied', message: 'Location permission was not granted. Enter a city, state, or ZIP code instead.' };

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const location: ProfessionalSearchLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: 'device',
    };

    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      if (address) {
        location.city = address.city ?? address.subregion ?? undefined;
        location.state = address.region ?? undefined;
        location.postalCode = address.postalCode ?? undefined;
      }
    } catch {
      // Coordinates are sufficient for a future provider when address lookup is unavailable.
    }

    return { status: 'granted', location };
  } catch {
    return { status: 'error', message: 'Your location could not be determined. Enter a city, state, or ZIP code instead.' };
  }
}

export function formatProfessionalSearchLocation(location: ProfessionalSearchLocation): string {
  const cityState = [location.city, location.state].filter(Boolean).join(', ');
  if (cityState && location.postalCode) return `${cityState} ${location.postalCode}`;
  if (cityState) return cityState;
  if (location.postalCode) return location.postalCode;
  return location.source === 'device' ? 'Approximate device location' : 'Manual location';
}
