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

export const MOCK_SUBWAY_COMMUTES: SubwayCommute[] = [
  { mode: 'subway', line: '4', station: '86 St · Lexington Ave', direction: 'Downtown Manhattan', nextArrivalMinutes: 3, followingArrivalMinutes: 9, status: 'Good Service', delayMinutes: 0 },
  { mode: 'subway', line: '6', station: '77 St · Lexington Ave', direction: 'Brooklyn Bridge', nextArrivalMinutes: 7, followingArrivalMinutes: 14, status: 'Good Service', delayMinutes: 0 },
  { mode: 'subway', line: 'A', station: '72 St · Central Park West', direction: 'Downtown Manhattan', nextArrivalMinutes: 4, followingArrivalMinutes: 11, status: 'Good Service', delayMinutes: 0 },
  { mode: 'subway', line: 'Q', station: '72 St · 2nd Ave', direction: 'Times Sq–42 St', nextArrivalMinutes: 9, followingArrivalMinutes: 17, status: 'Minor Delays', delayMinutes: 5 },
];

export async function getTraffic() {
  const commuteData: DrivingCommute = { mode: 'driving', durationMinutes: 28, usualMinutes: 28, status: 'Normal' };
  return { commute: '28 mins', commuteData };
}
