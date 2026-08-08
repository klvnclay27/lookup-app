import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSports } from '@/services/sports';
import { getTraffic } from '@/services/traffic';
import { getWeather, getWeatherCondition } from '@/services/weather';

export type IntelligencePriority = 'routine' | 'useful' | 'important';
export type DailyLockerContext = { favoriteCount?: number; itemCount?: number };
export type DailyIntelligenceInput = {
  now?: Date;
  userName?: string;
  weather?: { condition?: string; temperature?: number };
  traffic?: { commute?: string; status?: string; usualMinutes?: number };
  music?: { playlist?: string; tracks?: string[] };
  sports?: { games?: string[] };
  locker?: DailyLockerContext;
};
export type DailyInsight = {
  category: 'weather' | 'traffic' | 'sports' | 'music' | 'locker' | 'day';
  detail: string;
  id: string;
  priority: IntelligencePriority;
  title: string;
};
export type DailyIntelligenceResult = { greeting: string; headline: string; insights: DailyInsight[]; priority: IntelligencePriority; summary: string };
export type DailyIntelligenceSnapshot = DailyIntelligenceResult & {
  sources: Pick<DailyIntelligenceInput, 'sports' | 'traffic' | 'weather'>;
};

const WARDROBE_STORAGE_KEY = 'lookup.myLocker.wardrobe.v1';
const priorityRank: Record<IntelligencePriority, number> = { routine: 0, useful: 1, important: 2 };

const greetingForHour = (hour: number) => hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
const isWetWeather = (condition?: string) => /rain|drizzle|shower|thunder|storm/i.test(condition ?? '');
const commuteMinutes = (commute?: string) => {
  const value = commute?.match(/\d+/)?.[0];
  return value ? Number(value) : undefined;
};

export function generateDailyIntelligence(input: DailyIntelligenceInput): DailyIntelligenceResult {
  const now = input.now ?? new Date();
  const hour = now.getHours();
  const greeting = greetingForHour(hour);
  const insights: DailyInsight[] = [];
  const temperature = input.weather?.temperature;
  const wet = isWetWeather(input.weather?.condition);
  const commute = commuteMinutes(input.traffic?.commute);

  if (wet) insights.push({ id: 'weather-rain', category: 'weather', priority: 'important', title: 'Plan for rain', detail: 'Bring an umbrella and choose a water-resistant outer layer.' });
  else if (typeof temperature === 'number' && temperature <= 50) insights.push({ id: 'weather-cold', category: 'weather', priority: 'useful', title: 'Dress for cooler weather', detail: `It is ${temperature}\u00B0 outside. A jacket or warmer layer will help.` });
  else if (typeof temperature === 'number' && temperature >= 82) insights.push({ id: 'weather-hot', category: 'weather', priority: 'useful', title: "Keep today's outfit light", detail: `At ${temperature}\u00B0, lighter layers and breathable shoes make sense.` });
  else if (typeof temperature === 'number') insights.push({ id: 'weather-mild', category: 'weather', priority: 'routine', title: 'Comfortable conditions', detail: `${input.weather?.condition ?? 'Mild weather'} and ${temperature}\u00B0 are expected right now.` });

  if (typeof commute === 'number' && commute >= 40) insights.push({ id: 'traffic-heavy', category: 'traffic', priority: 'important', title: 'Leave earlier than usual', detail: `Your commute is about ${commute} minutes. Add at least 10 minutes of buffer.` });
  else if (input.traffic?.status && /heavy|delay|slow/i.test(input.traffic.status)) insights.push({ id: 'traffic-status', category: 'traffic', priority: 'important', title: 'Traffic is running slowly', detail: 'Give yourself extra travel time before heading out.' });
  else if (typeof commute === 'number') insights.push({ id: 'traffic-normal', category: 'traffic', priority: 'routine', title: 'Commute check', detail: `Current travel time is approximately ${commute} minutes.` });

  const game = input.sports?.games?.find((item) => item.trim().length > 0);
  if (game && !/unavailable/i.test(game)) insights.push({ id: 'sports-game', category: 'sports', priority: 'useful', title: 'Game on today', detail: game.trim() });

  const track = input.music?.tracks?.find((item) => item.trim().length > 0);
  if (track || input.music?.playlist) insights.push({ id: 'music-pick', category: 'music', priority: 'routine', title: 'A soundtrack for your day', detail: track ? `Start with "${track}" from ${input.music?.playlist ?? 'your music'}.` : `Your ${input.music?.playlist} playlist is ready.` });

  if (input.locker?.itemCount) {
    const favorites = input.locker.favoriteCount ? `, including ${input.locker.favoriteCount} favorite${input.locker.favoriteCount === 1 ? '' : 's'}` : '';
    insights.push({ id: 'locker-ready', category: 'locker', priority: wet || (typeof temperature === 'number' && (temperature <= 50 || temperature >= 82)) ? 'useful' : 'routine', title: 'Your Locker is ready', detail: `${input.locker.itemCount} wardrobe items${favorites} are available for today's look.` });
  }

  if (!insights.length) insights.push({ id: 'day-ready', category: 'day', priority: 'routine', title: 'Your day is ready', detail: 'LookUP will add guidance as weather, commute, sports, music, and wardrobe data become available.' });

  const sortedInsights = [...insights].sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
  const priority = sortedInsights[0]?.priority ?? 'routine';
  const headline = priority === 'important' ? 'A few things need your attention before you head out.' : hour < 12 ? 'Your morning, distilled into what matters most.' : hour < 18 ? 'A focused update for the rest of your day.' : 'A concise look at what is still ahead tonight.';
  const usualCommute = input.traffic?.usualMinutes ?? 28;
  const commuteDelay = typeof commute === 'number' ? Math.max(0, commute - usualCommute) : 0;
  const delayedTraffic = Boolean(input.traffic?.status && /heavy|delay|slow/i.test(input.traffic.status)) || commuteDelay >= 10;
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const summary = delayedTraffic
    ? commuteDelay > 0
      ? `Heads up — your commute is running about ${commuteDelay} minutes longer than usual.`
      : 'Heads up — traffic conditions may require extra travel time.'
    : wet
      ? 'Wet weather could affect your plans — it may be worth preparing before you leave.'
      : typeof temperature === 'number' && temperature >= 90
        ? 'Temperatures will be unusually hot today — plan around the heat.'
        : typeof temperature === 'number' && temperature <= 32
          ? 'Temperatures will be unusually cold today — prepare for freezing conditions.'
          : `Everything looks on track this ${dayPart}.`;
  return { greeting, headline, insights: sortedInsights.slice(0, 4), priority, summary };
}

export async function readDailyLockerContext(): Promise<DailyLockerContext | undefined> {
  try {
    const stored = await AsyncStorage.getItem(WARDROBE_STORAGE_KEY);
    if (!stored) return undefined;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return undefined;
    return { itemCount: parsed.length, favoriteCount: parsed.filter((item) => typeof item === 'object' && item !== null && 'favorite' in item && item.favorite === true).length };
  } catch {
    return undefined;
  }
}

export async function getDailyIntelligence(now = new Date()): Promise<DailyIntelligenceSnapshot> {
  const [weatherResult, trafficResult, sportsResult, lockerResult] = await Promise.allSettled([
    getWeather(),
    getTraffic(),
    getSports(),
    readDailyLockerContext(),
  ]);

  const weather = weatherResult.status === 'fulfilled'
    ? { condition: getWeatherCondition(weatherResult.value.weatherCode), temperature: weatherResult.value.temperature }
    : undefined;
  const traffic = trafficResult.status === 'fulfilled' ? trafficResult.value : undefined;
  const sports = sportsResult.status === 'fulfilled' ? sportsResult.value : undefined;
  const locker = lockerResult.status === 'fulfilled' ? lockerResult.value : undefined;
  const briefing = generateDailyIntelligence({ now, weather, traffic, sports, locker });

  return { ...briefing, sources: { sports, traffic, weather } };
}
