import type { CommuteMode } from '@/services/traffic';

export type CalendarEventType = 'work' | 'appointment' | 'meeting' | 'dinner' | 'flight' | 'birthday' | 'personal' | 'reminder';
export type CalendarEventImportance = 'low' | 'normal' | 'high';

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

export async function getCalendarEvents(now = new Date()): Promise<CalendarEvent[]> {
  return [createMockCalendarEvent(now, {
    title: 'Dinner reservation',
    type: 'dinner',
    location: 'West Village',
    travelRequired: true,
    preferredCommuteMode: 'subway',
    importance: 'normal',
  }, 360)];
}
