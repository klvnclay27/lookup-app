import type { CommuteMode } from '@/services/traffic';

export type CalendarEventType = 'work' | 'appointment' | 'meeting' | 'dinner' | 'flight' | 'birthday' | 'personal' | 'reminder';
export type CalendarEventImportance = 'low' | 'normal' | 'high';
export type CalendarDataProvenance = 'live' | 'mock' | 'unavailable';

export type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt?: string;
  location?: string;
  type: CalendarEventType;
  allDay: boolean;
  travelRequired: boolean;
  preferredCommuteMode?: CommuteMode;
  importance: CalendarEventImportance;
};

export type CalendarSnapshot = { events: CalendarEvent[]; updatedAt: string; dataProvider: string };
export type CalendarDataResult =
  | { data: CalendarSnapshot; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export interface CalendarDataProvider {
  readonly name: string;
  readonly provenance: 'live' | 'mock';
  getEvents(now: Date): Promise<CalendarEvent[]>;
}

export function createMockCalendarEvent(now: Date, overrides: Partial<CalendarEvent> & Pick<CalendarEvent, 'title'>, minutesUntil: number): CalendarEvent {
  const start = new Date(now.getTime() + minutesUntil * 60000);
  const end = new Date(start.getTime() + 60 * 60000);
  return {
    id: `mock-${overrides.type ?? 'event'}-${start.getTime()}`,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    type: 'personal',
    allDay: false,
    travelRequired: false,
    importance: 'low',
    ...overrides,
  };
}

export const mockCalendarProvider: CalendarDataProvider = {
  name: 'LookUP local calendar fixture',
  provenance: 'mock',
  async getEvents(now) {
    return [createMockCalendarEvent(now, {
      title: 'Dinner reservation',
      type: 'dinner',
      location: 'West Village',
      travelRequired: true,
      preferredCommuteMode: 'subway',
      importance: 'normal',
    }, 360)];
  },
};

export async function getCalendarEvents(now = new Date(), provider: CalendarDataProvider = mockCalendarProvider): Promise<CalendarDataResult> {
  try {
    return { data: { events: await provider.getEvents(now), updatedAt: new Date().toISOString(), dataProvider: provider.name }, error: null, provenance: provider.provenance };
  } catch {
    return { data: null, error: 'Calendar information is currently unavailable.', provenance: 'unavailable' };
  }
}

export function getCalendarForIntelligence(result: CalendarDataResult, options: { allowMock?: boolean } = {}): { events: CalendarEvent[] } | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;
  return { events: result.data.events };
}
