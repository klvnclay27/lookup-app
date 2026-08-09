export type CommuteMode = 'driving' | 'subway' | 'bus' | 'walking' | 'flight' | 'other';

export type DrivingCommute = {
  mode: 'driving';
  durationMinutes: number;
  usualMinutes: number;
  status: 'Light' | 'Normal' | 'Moderate' | 'Heavy';
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

export type CommuteData = DrivingCommute | SubwayCommute | { mode: Exclude<CommuteMode, 'driving' | 'subway'>; durationMinutes?: number; status?: string };

export type TrafficDataProvenance = 'live' | 'mock' | 'unavailable';

export type TrafficSummary = {
  commute: string;
  status: string;
  usualMinutes: number;
};

export type TrafficSnapshot = {
  commuteData: CommuteData;
  summary: TrafficSummary;
  subwayCommutes: SubwayCommute[];
  updatedAt: string;
};

export type TrafficDataResult =
  | {
      data: TrafficSnapshot;
      error: null;
      provenance: 'live' | 'mock';
    }
  | {
      data: null;
      error: string;
      provenance: 'unavailable';
    };

export interface TrafficDataProvider {
  readonly provenance: 'live' | 'mock';
  getTraffic(): Promise<TrafficSnapshot>;
}

export const MOCK_SUBWAY_COMMUTES: SubwayCommute[] = [
  { mode: 'subway', line: '4', station: '86 St · Lexington Ave', direction: 'Downtown Manhattan', nextArrivalMinutes: 3, followingArrivalMinutes: 9, status: 'Good Service', delayMinutes: 0 },
  { mode: 'subway', line: '6', station: '77 St · Lexington Ave', direction: 'Brooklyn Bridge', nextArrivalMinutes: 7, followingArrivalMinutes: 14, status: 'Good Service', delayMinutes: 0 },
  { mode: 'subway', line: 'A', station: '72 St · Central Park West', direction: 'Downtown Manhattan', nextArrivalMinutes: 4, followingArrivalMinutes: 11, status: 'Good Service', delayMinutes: 0 },
  { mode: 'subway', line: 'Q', station: '72 St · 2nd Ave', direction: 'Times Sq–42 St', nextArrivalMinutes: 9, followingArrivalMinutes: 17, status: 'Minor Delays', delayMinutes: 5 },
];

export const mockTrafficProvider: TrafficDataProvider = {
  provenance: 'mock',
  async getTraffic() {
    const commuteData: DrivingCommute = {
      mode: 'driving',
      durationMinutes: 28,
      usualMinutes: 28,
      status: 'Normal',
    };

    return {
      commuteData,
      summary: {
        commute: `${commuteData.durationMinutes} mins`,
        status: commuteData.status,
        usualMinutes: commuteData.usualMinutes,
      },
      subwayCommutes: MOCK_SUBWAY_COMMUTES,
      updatedAt: new Date().toISOString(),
    };
  },
};

export async function getTraffic(provider: TrafficDataProvider = mockTrafficProvider): Promise<TrafficDataResult> {
  try {
    const data = await provider.getTraffic();
    return { data, error: null, provenance: provider.provenance };
  } catch {
    return {
      data: null,
      error: 'Traffic information is currently unavailable.',
      provenance: 'unavailable',
    };
  }
}

export function getTrafficSummaryForIntelligence(
  result: TrafficDataResult,
  options: { allowMock?: boolean } = {},
): TrafficSummary | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;
  return result.data.summary;
}
