import AsyncStorage from '@react-native-async-storage/async-storage';

import { createMockCalendarEvent, type CalendarEvent } from '@/services/calendar';
import type { ClothingItem } from '@/constants/starter-wardrobe';
import { type CommuteData, type SubwayCommute, type TrafficSummary } from '@/services/traffic';
import { getWeather, getWeatherCondition } from '@/services/weather';

export type IntelligencePriority = 'routine' | 'useful' | 'important';
export type DailyWardrobeItem = Pick<ClothingItem, 'brand' | 'category' | 'favorite' | 'id' | 'name' | 'primaryColor'>;
export type DailyLockerContext = { favoriteCount?: number; itemCount?: number; items?: DailyWardrobeItem[] };
export type WardrobeRecommendation = { detail: string; itemNames: string[]; score: number; title: string };
export type DailyIntelligenceInput = {
  now?: Date;
  userName?: string;
  commute?: CommuteData;
  calendar?: { events?: CalendarEvent[] };
  weather?: { condition?: string; temperature?: number };
  traffic?: Partial<TrafficSummary>;
  music?: { playlist?: string; tracks?: string[] };
  sports?: { favoriteTeams?: string[]; games?: string[] };
  locker?: DailyLockerContext;
};
export type DailyInsight = {
  category: 'calendar' | 'weather' | 'traffic' | 'transit' | 'sports' | 'music' | 'locker' | 'day';
  detail: string;
  id: string;
  priority: IntelligencePriority;
  score: number;
  title: string;
};
export type DailyIntelligenceResult = { greeting: string; headline: string; insights: DailyInsight[]; priority: IntelligencePriority; summary: string };
export type DailyIntelligenceSnapshot = DailyIntelligenceResult & {
  sources: Pick<DailyIntelligenceInput, 'calendar' | 'commute' | 'locker' | 'sports' | 'traffic' | 'weather'>;
};
export const DAILY_INTELLIGENCE_TEST_SCENARIOS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Rain', value: 'rain' },
  { label: 'Cold', value: 'cold' },
  { label: 'Hot', value: 'hot' },
  { label: 'Heavy Traffic', value: 'heavy-traffic' },
  { label: 'Game Soon', value: 'game-soon' },
  { label: 'Multiple Issues', value: 'multiple-issues' },
  { label: 'Subway Normal', value: 'subway-normal' },
  { label: 'Subway Delay', value: 'subway-delay' },
  { label: 'Major Subway Delay', value: 'major-subway-delay' },
  { label: 'Service Change', value: 'service-change' },
  { label: 'Rain + Subway Delay', value: 'rain-subway-delay' },
  { label: 'Event Later', value: 'event-later' },
  { label: 'Event Soon', value: 'event-soon' },
  { label: 'Event + Subway Delay', value: 'event-subway-delay' },
  { label: 'Event + Heavy Traffic', value: 'event-heavy-traffic' },
  { label: 'Event + Rain', value: 'event-rain' },
  { label: 'Event + Rain + Subway Delay', value: 'event-rain-subway-delay' },
] as const;
export type DailyIntelligenceTestScenario = typeof DAILY_INTELLIGENCE_TEST_SCENARIOS[number]['value'];
export type PriorityScoreInput = { base: number; compoundBoost?: number; timeBoost?: number };
export type DailyHeadlineContext = {
  dayPart: 'morning' | 'afternoon' | 'evening';
  eventTitle?: string;
  gameTeam?: string;
  severeWeather?: boolean;
  topInsight?: DailyInsight;
  secondInsight?: DailyInsight;
  wetWeather?: boolean;
};

const WARDROBE_STORAGE_KEY = 'lookup.myLocker.wardrobe.v1';

export function calculatePriorityScore({ base, compoundBoost = 0, timeBoost = 0 }: PriorityScoreInput) {
  return Math.max(0, Math.min(100, Math.round(base + compoundBoost + timeBoost)));
}

export function priorityForScore(score: number): IntelligencePriority {
  if (score >= 75) return 'important';
  if (score >= 45) return 'useful';
  return 'routine';
}

export function buildDailyHeadline({ dayPart, eventTitle, gameTeam, severeWeather, topInsight, secondInsight, wetWeather }: DailyHeadlineContext) {
  const multipleUrgent = Boolean(topInsight && secondInsight && topInsight.score >= 75 && secondInsight.score >= 75);
  if (multipleUrgent) return `A couple things need your attention this ${dayPart}.`;
  if (!topInsight || topInsight.score < 45) return `Everything looks pretty smooth this ${dayPart}.`;

  switch (topInsight.category) {
    case 'calendar':
      return `${eventTitle ?? 'Your next event'} is coming up this ${dayPart}.`;
    case 'weather':
      if (severeWeather) return `Weather is the main thing to watch this ${dayPart}.`;
      if (wetWeather) return `Rain could change your plans this ${dayPart}.`;
      return `The temperature is worth planning around this ${dayPart}.`;
    case 'traffic':
      return `Give yourself some extra time this ${dayPart}.`;
    case 'transit':
      return topInsight.score >= 75 ? `Your train needs attention this ${dayPart}.` : `Your train is the next thing to watch this ${dayPart}.`;
    case 'sports': {
      const team = sentenceCase(withArticle(gameTeam));
      const timing = dayPart === 'evening' ? 'tonight' : dayPart === 'afternoon' ? 'this afternoon' : 'later today';
      return `${team} are the big thing to watch ${timing}.`;
    }
    case 'music':
      return `Your soundtrack is ready for this ${dayPart}.`;
    case 'locker':
      return `Your look is worth a quick check this ${dayPart}.`;
    default:
      return `Your ${dayPart} briefing is ready.`;
  }
}

const greetingForHour = (hour: number) => hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
const isWetWeather = (condition?: string) => /rain|drizzle|shower|thunder|storm/i.test(condition ?? '');
const isSevereWeather = (condition?: string) => /thunder|storm|tornado|hurricane|hail|ice|blizzard/i.test(condition ?? '');
const isCommuteHour = (hour: number) => (hour >= 6 && hour < 10) || (hour >= 15 && hour < 19);
const commuteMinutes = (commute?: string) => {
  const value = commute?.match(/\d+/)?.[0];
  return value ? Number(value) : undefined;
};

function parseGame(game?: string, now = new Date()) {
  if (!game || /unavailable/i.test(game)) return undefined;
  const text = game.trim();
  const matchup = text.match(/^(.+?)\s+vs\.?\s+(.+?)\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!matchup) return { text };
  const hour12 = Number(matchup[3]);
  const gameHour = (hour12 % 12) + (matchup[5].toUpperCase() === 'PM' ? 12 : 0);
  const gameDate = new Date(now);
  gameDate.setHours(gameHour, Number(matchup[4] ?? 0), 0, 0);
  return {
    away: matchup[1].trim(),
    home: matchup[2].trim(),
    minutesUntil: Math.round((gameDate.getTime() - now.getTime()) / 60000),
    text,
    time: `${matchup[3]}${matchup[4] && matchup[4] !== '00' ? `:${matchup[4]}` : ''} ${matchup[5].toUpperCase()}`,
  };
}

const BASKETBALL_TEAMS = /knicks|celtics|nets|lakers|warriors|bucks|bulls|heat/i;
const BASEBALL_TEAMS = /yankees|mets|phillies|red sox|dodgers/i;
const withArticle = (team?: string) => team ? (/^the\s/i.test(team) ? team : `the ${team}`) : 'your team';
const sentenceCase = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

function gameLanguage(away?: string, home?: string) {
  const matchup = `${away ?? ''} ${home ?? ''}`;
  if (BASKETBALL_TEAMS.test(matchup)) return {
    later: `${withArticle(away)} tip off${home ? ` against ${withArticle(home)}` : ''}`,
    laterTitle: `${away ?? 'Your team'} tip off later`,
    soon: `${away ?? 'Your team'} tip off soon`,
    startsIn: `${withArticle(away)} tip off`,
  };
  if (BASEBALL_TEAMS.test(matchup)) return {
    later: `${withArticle(away)} face${home ? ` ${withArticle(home)}` : ' their opponent'}`,
    laterTitle: `${away ?? 'Your team'} play later today`,
    soon: `${away ?? 'Your team'} first pitch is coming up`,
    startsIn: `First pitch for ${withArticle(away)} is`,
  };
  return {
    later: `${withArticle(away)} play${home ? ` ${withArticle(home)}` : ''}`,
    laterTitle: `${away ?? 'Your team'} play later today`,
    soon: `${away ?? 'Your team'} play soon`,
    startsIn: `${withArticle(away)} play`,
  };
}

const naturalItemName = (name: string) => `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
const itemSearchText = (item: DailyWardrobeItem) => `${item.name} ${item.brand} ${item.primaryColor} ${item.category}`.toLowerCase();
const favoriteFirst = (items: DailyWardrobeItem[]) => [...items].sort((a, b) => Number(b.favorite) - Number(a.favorite));

export function getWardrobeRecommendation({ condition, dayPart, items = [], temperature }: {
  condition?: string;
  dayPart: 'morning' | 'afternoon' | 'evening';
  items?: DailyWardrobeItem[];
  temperature?: number;
}): WardrobeRecommendation | undefined {
  if (!items.length) return undefined;
  const wet = isWetWeather(condition);
  const named = (pattern: RegExp, category?: DailyWardrobeItem['category']) => favoriteFirst(items.filter((item) => (!category || item.category === category) && pattern.test(itemSearchText(item))));

  if (wet) {
    const rainLayer = named(/rain|waterproof|water-resistant|shell|trench|parka/, 'Jackets')[0];
    const rainShoes = named(/waterproof|rain|boot/, 'Shoes')[0];
    const match = rainLayer ?? rainShoes;
    if (match) return { detail: `Your ${naturalItemName(match.name)} would work well in the rain this ${dayPart}.`, itemNames: [match.name], score: 55, title: 'A rain-ready option from My Locker' };
    return undefined;
  }

  if (typeof temperature === 'number' && temperature <= 50) {
    const layer = favoriteFirst([
      ...items.filter((item) => item.category === 'Jackets'),
      ...items.filter((item) => item.category === 'Shirts' && /hoodie|sweater|sweatshirt|fleece|cardigan/.test(itemSearchText(item))),
    ])[0];
    if (layer) return { detail: `Your ${naturalItemName(layer.name)} is a good layer for this ${dayPart}.`, itemNames: [layer.name], score: temperature <= 32 ? 50 : 34, title: 'A warmer layer from My Locker' };
    return undefined;
  }

  if (typeof temperature === 'number' && temperature >= 82) {
    const lightTop = named(/tee|t-shirt|tank|linen|polo|shirt/, 'Shirts')[0];
    const shorts = named(/short/, 'Pants')[0];
    const matches = [lightTop, shorts].filter((item): item is DailyWardrobeItem => Boolean(item));
    if (matches.length) {
      const names = matches.map((item) => naturalItemName(item.name));
      const outfit = names.length === 2 ? `${names[0]} and ${names[1]}` : names[0];
      return { detail: `Your ${outfit} would keep things light this ${dayPart}.`, itemNames: matches.map((item) => item.name), score: temperature >= 90 ? 46 : 30, title: 'A lighter option from My Locker' };
    }
    return undefined;
  }

  const favoriteTop = favoriteFirst(items.filter((item) => item.category === 'Shirts' && item.favorite))[0];
  return favoriteTop ? { detail: `Your ${naturalItemName(favoriteTop.name)} fits the comfortable weather this ${dayPart}.`, itemNames: [favoriteTop.name], score: 8, title: 'An easy option from My Locker' } : undefined;
}

function createInsight(insight: Omit<DailyInsight, 'priority'>): DailyInsight {
  return { ...insight, priority: priorityForScore(insight.score) };
}

const formatClockTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function nextCalendarEvent(events: CalendarEvent[] | undefined, now: Date) {
  return events
    ?.map((event) => ({ event, start: new Date(event.startAt) }))
    .filter(({ start }) => !Number.isNaN(start.getTime()) && start.getTime() >= now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
}

export function generateDailyIntelligence(input: DailyIntelligenceInput): DailyIntelligenceResult {
  const now = input.now ?? new Date();
  const hour = now.getHours();
  const greeting = greetingForHour(hour);
  const temperature = input.weather?.temperature;
  const wet = isWetWeather(input.weather?.condition);
  const severeWeather = isSevereWeather(input.weather?.condition);
  const commute = commuteMinutes(input.traffic?.commute);
  const usualCommute = input.traffic?.usualMinutes ?? 28;
  const commuteDelay = typeof commute === 'number' ? Math.max(0, commute - usualCommute) : 0;
  const trafficStatusDelayed = Boolean(input.traffic?.status && /heavy|delay|slow/i.test(input.traffic.status));
  const commuteRelevantNow = isCommuteHour(hour);
  const subway = input.commute?.mode === 'subway' ? input.commute : undefined;
  const game = parseGame(input.sports?.games?.find((item) => item.trim().length > 0), now);
  const upcomingEvent = nextCalendarEvent(input.calendar?.events, now);
  const eventMinutesUntil = upcomingEvent ? Math.round((upcomingEvent.start.getTime() - now.getTime()) / 60000) : undefined;
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const naturalTime = hour < 12 ? 'this morning' : hour < 18 ? 'this afternoon' : 'tonight';
  const wardrobeRecommendation = getWardrobeRecommendation({ condition: input.weather?.condition, dayPart, items: input.locker?.items, temperature });

  let weatherBase = severeWeather ? 92 : wet ? 80 : typeof temperature === 'number' && (temperature <= 32 || temperature >= 90) ? 70 : typeof temperature === 'number' && (temperature <= 50 || temperature >= 82) ? 45 : typeof temperature === 'number' ? 18 : 0;
  let trafficBase = commuteDelay >= 20 ? 88 : trafficStatusDelayed ? 78 : commuteDelay >= 10 ? 62 : typeof commute === 'number' ? 22 : 0;
  const transitBase = !subway ? 0 : subway.status === 'Major Delays' || subway.delayMinutes >= 20 ? 92 : subway.status === 'Service Change' ? 82 : subway.status === 'Delayed' || subway.delayMinutes >= 10 ? 76 : subway.status === 'Minor Delays' || subway.delayMinutes > 0 ? 56 : 18;
  const calendarBase = typeof eventMinutesUntil !== 'number' ? 0 : eventMinutesUntil <= 15 ? 84 : eventMinutesUntil <= 60 ? 70 : eventMinutesUntil <= 120 ? 55 : eventMinutesUntil <= 480 ? 32 : eventMinutesUntil <= 1440 ? 24 : 12;
  const weatherAffectsPlans = weatherBase >= 70;
  const trafficAffectsPlans = trafficBase >= 60;
  const transitAffectsPlans = transitBase >= 56;
  const eventTravelSoon = Boolean(upcomingEvent?.event.travelRequired && typeof eventMinutesUntil === 'number' && eventMinutesUntil <= 120);
  const eventCommuteRisk = Boolean(eventTravelSoon && (trafficAffectsPlans || transitAffectsPlans));
  const eventWeatherRisk = Boolean(eventTravelSoon && wet);
  const compoundBoost = weatherAffectsPlans && (trafficAffectsPlans || transitAffectsPlans) ? 6 : 0;
  const weatherScore = calculatePriorityScore({ base: weatherBase, compoundBoost: compoundBoost + (eventWeatherRisk ? 5 : 0), timeBoost: wet && commuteRelevantNow ? 8 : 0 });
  const trafficScore = calculatePriorityScore({ base: trafficBase, compoundBoost: compoundBoost + (eventCommuteRisk ? 5 : 0), timeBoost: trafficAffectsPlans && commuteRelevantNow ? 8 : 0 });
  const transitScore = calculatePriorityScore({ base: transitBase, compoundBoost: compoundBoost + (eventCommuteRisk ? 5 : 0), timeBoost: subway && commuteRelevantNow ? subway.status === 'Good Service' && subway.nextArrivalMinutes <= 5 ? 30 : transitAffectsPlans ? 8 : 0 : 0 });
  const calendarScore = calculatePriorityScore({ base: calendarBase, compoundBoost: (eventCommuteRisk ? 8 : 0) + (eventWeatherRisk ? 6 : 0), timeBoost: upcomingEvent?.event.importance === 'high' ? 10 : upcomingEvent?.event.importance === 'low' ? -5 : 0 });
  const insights: DailyInsight[] = [];

  if (upcomingEvent && typeof eventMinutesUntil === 'number') {
    const event = upcomingEvent.event;
    const travelMinutes = event.travelRequired ? subway ? 30 + subway.delayMinutes : commute ?? 30 : 0;
    const leaveBy = event.travelRequired ? new Date(upcomingEvent.start.getTime() - (travelMinutes + 10) * 60000) : undefined;
    const title = eventMinutesUntil <= 15 ? `${event.title} starts very soon` : eventMinutesUntil <= 60 ? `${event.title} is coming up` : eventMinutesUntil <= 120 ? `${event.title} in about ${Math.ceil(eventMinutesUntil / 30) * 30} minutes` : `${formatClockTime(upcomingEvent.start)} · ${event.title}`;
    const detailParts = [event.location, leaveBy ? `Leave by ${formatClockTime(leaveBy)}` : event.allDay ? 'All day' : `Starts at ${formatClockTime(upcomingEvent.start)}`].filter(Boolean);
    insights.push(createInsight({ id: `calendar-${event.id}`, category: 'calendar', score: calendarScore, title, detail: detailParts.join(' · ') }));
  }

  if (weatherScore > 0) {
    if (severeWeather) insights.push(createInsight({ id: 'weather-severe', category: 'weather', score: weatherScore, title: 'Weather needs attention', detail: `${input.weather?.condition ?? 'Severe weather'} could disrupt your plans ${naturalTime}.` }));
    else if (wet) {
      const rainDetail = commuteRelevantNow ? 'Rain could affect your commute.' : `Rain is in the mix ${naturalTime}.`;
      insights.push(createInsight({ id: 'weather-rain', category: 'weather', score: weatherScore, title: 'Rain may affect plans', detail: wardrobeRecommendation?.score && wardrobeRecommendation.score >= 50 ? `${rainDetail} ${wardrobeRecommendation.detail}` : `${rainDetail} Keep an umbrella handy.` }));
    }
    else if (typeof temperature === 'number' && temperature <= 50) {
      const coldDetail = `It'll stay cool ${naturalTime} around ${temperature}\u00B0.`;
      insights.push(createInsight({ id: 'weather-cold', category: 'weather', score: weatherScore, title: 'Grab an extra layer', detail: wardrobeRecommendation?.score && wardrobeRecommendation.score >= 30 ? `${coldDetail} ${wardrobeRecommendation.detail}` : coldDetail }));
    }
    else if (typeof temperature === 'number' && temperature >= 82) {
      const hotDetail = `It'll stay warm ${naturalTime} around ${temperature}\u00B0.`;
      insights.push(createInsight({ id: 'weather-hot', category: 'weather', score: weatherScore, title: 'A warm stretch ahead', detail: wardrobeRecommendation?.score && wardrobeRecommendation.score >= 30 ? `${hotDetail} ${wardrobeRecommendation.detail}` : hotDetail }));
    }
    else if (typeof temperature === 'number') insights.push(createInsight({ id: 'weather-mild', category: 'weather', score: weatherScore, title: 'Comfortable conditions', detail: `It'll stay comfortable ${naturalTime} around ${temperature}\u00B0.` }));
  }

  if (trafficScore > 0) {
    if (commuteDelay >= 10) insights.push(createInsight({ id: 'traffic-delay', category: 'traffic', score: trafficScore, title: 'Your commute is running long', detail: `Plan on about ${commute} minutes — ${commuteDelay} longer than usual.` }));
    else if (trafficStatusDelayed) insights.push(createInsight({ id: 'traffic-status', category: 'traffic', score: trafficScore, title: 'Give yourself extra time', detail: 'Traffic is moving slower than usual right now.' }));
    else if (typeof commute === 'number') insights.push(createInsight({ id: 'traffic-normal', category: 'traffic', score: trafficScore, title: 'Commute check', detail: `Your commute is looking normal at about ${commute} minutes.` }));
  }

  if (subway && transitScore > 0) {
    const route = `${subway.line} train · ${subway.direction}`;
    if (subway.status === 'Major Delays' || subway.delayMinutes >= 20) insights.push(createInsight({ id: 'transit-major-delay', category: 'transit', score: transitScore, title: `${subway.line} train has major delays`, detail: `${route} is about ${subway.delayMinutes} minutes behind schedule.` }));
    else if (subway.status === 'Service Change') insights.push(createInsight({ id: 'transit-service-change', category: 'transit', score: transitScore, title: `${subway.line} train service change`, detail: subway.serviceChanges?.[0] ?? `${route} is running with a service change.` }));
    else if (subway.status === 'Delayed' || subway.delayMinutes >= 10) insights.push(createInsight({ id: 'transit-delay', category: 'transit', score: transitScore, title: `${subway.line} train is delayed`, detail: `${route} is about ${subway.delayMinutes} minutes behind schedule.` }));
    else if (subway.status === 'Minor Delays' || subway.delayMinutes > 0) insights.push(createInsight({ id: 'transit-minor-delay', category: 'transit', score: transitScore, title: `Minor ${subway.line} train delays`, detail: `${route} is running about ${subway.delayMinutes} minutes late.` }));
    else insights.push(createInsight({ id: 'transit-normal', category: 'transit', score: transitScore, title: `${subway.line} train arriving soon`, detail: `${route} arrives in ${subway.nextArrivalMinutes} minutes. ${subway.status}.` }));
  }

  if (game) {
    const startsSoon = typeof game.minutesUntil === 'number' && game.minutesUntil >= 0 && game.minutesUntil <= 120;
    const startsVerySoon = typeof game.minutesUntil === 'number' && game.minutesUntil >= 0 && game.minutesUntil <= 30;
    const favorite = input.sports?.favoriteTeams?.some((team) => game.text.toLowerCase().includes(team.toLowerCase())) ?? false;
    const gameScore = calculatePriorityScore({ base: startsVerySoon ? 72 : startsSoon ? 60 : 20, timeBoost: favorite ? 8 : 0 });
    const sportsCopy = gameLanguage(game.away, game.home);
    insights.push(createInsight({ id: 'sports-game', category: 'sports', score: gameScore, title: startsSoon ? sportsCopy.soon : sportsCopy.laterTitle, detail: game.away && game.home ? `${sportsCopy.later}${game.time ? ` at ${game.time}` : ' today'}.` : game.text }));
  }

  const track = input.music?.tracks?.find((item) => item.trim().length > 0);
  if (track || input.music?.playlist) insights.push(createInsight({ id: 'music-pick', category: 'music', score: 12, title: 'A soundtrack for your day', detail: track ? `Start with "${track}" from ${input.music?.playlist ?? 'your music'}.` : `Your ${input.music?.playlist} playlist is ready.` }));
  if (wardrobeRecommendation) insights.push(createInsight({ id: 'locker-weather-match', category: 'locker', score: wardrobeRecommendation.score, title: wardrobeRecommendation.title, detail: wardrobeRecommendation.detail }));
  if (!insights.length) insights.push(createInsight({ id: 'day-ready', category: 'day', score: 0, title: 'Your day is ready', detail: 'LookUP will add guidance as more daily data becomes available.' }));

  const sortedInsights = [...insights].sort((a, b) => b.score - a.score);
  const topInsight = sortedInsights[0];
  const priority = topInsight?.priority ?? 'routine';
  const secondInsight = sortedInsights[1];
  const combinedWeatherTraffic = topInsight?.score >= 75 && secondInsight?.score >= 75 && new Set([topInsight.category, secondInsight.category]).size === 2 && [topInsight.category, secondInsight.category].every((category) => category === 'weather' || category === 'traffic' || category === 'transit');
  const headline = buildDailyHeadline({ dayPart, eventTitle: upcomingEvent?.event.title, gameTeam: game?.away, severeWeather, topInsight, secondInsight, wetWeather: wet });

  const routineBriefingParts: string[] = [];
  if (typeof temperature === 'number') {
    const weatherDescription = wet ? `Rain is possible ${naturalTime}` : temperature <= 50 ? `It'll stay cool ${naturalTime} around ${temperature}\u00B0` : temperature >= 82 ? `It'll stay warm ${naturalTime} around ${temperature}\u00B0` : `Weather looks comfortable ${naturalTime} around ${temperature}\u00B0`;
    routineBriefingParts.push(weatherDescription);
  } else if (input.weather?.condition) routineBriefingParts.push(`${input.weather.condition} conditions are expected`);
  if (typeof commute === 'number') routineBriefingParts.push(`your commute looks normal at about ${commute} minutes`);
  else if (input.traffic?.status) routineBriefingParts.push(`traffic is ${input.traffic.status.toLowerCase()}`);
  if (game) {
    if (game.away && game.home) {
      const timing = game.time ? `${game.time.includes('PM') && hour < 17 ? 'tonight' : 'today'} at ${game.time}` : 'today';
      routineBriefingParts.push(`${gameLanguage(game.away, game.home).later} ${timing}`);
    } else routineBriefingParts.push(`${game.text} is on today's sports schedule`);
  }
  if (upcomingEvent && calendarScore >= 30 && calendarScore < 45) {
    routineBriefingParts.push(`${upcomingEvent.event.title} is at ${formatClockTime(upcomingEvent.start)}`);
  }
  if (wardrobeRecommendation && wardrobeRecommendation.score < 10 && routineBriefingParts.length < 2) {
    routineBriefingParts.push(wardrobeRecommendation.detail.replace(/\.$/, '').replace(/^Your /, 'your '));
  }
  const routineBriefing = routineBriefingParts.length > 1
    ? `${routineBriefingParts.slice(0, -1).join(', ')}, and ${routineBriefingParts[routineBriefingParts.length - 1]}`
    : routineBriefingParts[0];
  let summary = routineBriefing
    ? `Your ${dayPart} looks clear. ${routineBriefing.charAt(0).toUpperCase()}${routineBriefing.slice(1)}.`
    : `Your ${dayPart} briefing will update as data becomes available.`;
  const eventTravelDelay = subway?.delayMinutes ?? commuteDelay;
  if (upcomingEvent && typeof eventMinutesUntil === 'number' && eventMinutesUntil <= 120 && upcomingEvent.event.travelRequired && eventWeatherRisk && eventCommuteRisk) {
    summary = `Rain and a commute delay could affect your trip to ${upcomingEvent.event.title}; leave about ${Math.max(10, eventTravelDelay)} minutes earlier.`;
  } else if (upcomingEvent && typeof eventMinutesUntil === 'number' && eventMinutesUntil <= 120 && upcomingEvent.event.travelRequired && eventCommuteRisk) {
    const commuteIssue = subway ? `the ${subway.line} train is delayed` : 'traffic is running heavy';
    summary = `Your ${upcomingEvent.event.title} is coming up, and ${commuteIssue}; leave about ${Math.max(10, eventTravelDelay)} minutes earlier.`;
  } else if (upcomingEvent && typeof eventMinutesUntil === 'number' && eventMinutesUntil <= 120 && upcomingEvent.event.travelRequired && eventWeatherRisk) {
    summary = `Rain could affect your trip to ${upcomingEvent.event.title}, so give yourself a little extra time.`;
  } else if (combinedWeatherTraffic) summary = `Weather and commute conditions both need attention before you head out this ${dayPart}.`;
  else if (topInsight?.category === 'calendar' && upcomingEvent) {
    const travelMinutes = upcomingEvent.event.travelRequired ? subway ? 30 + subway.delayMinutes : commute ?? 30 : 0;
    const leaveBy = upcomingEvent.event.travelRequired ? new Date(upcomingEvent.start.getTime() - (travelMinutes + 10) * 60000) : undefined;
    summary = leaveBy ? `Your ${upcomingEvent.event.title} starts at ${formatClockTime(upcomingEvent.start)}; plan to leave by ${formatClockTime(leaveBy)}.` : `Your ${upcomingEvent.event.title} starts at ${formatClockTime(upcomingEvent.start)}.`;
  }
  else if (topInsight?.category === 'weather' && topInsight.score >= 45) {
    if (severeWeather) summary = `${input.weather?.condition ?? 'Severe weather'} could disrupt your plans ${naturalTime}.`;
    else if (wet) summary = wardrobeRecommendation?.score && wardrobeRecommendation.score >= 50 ? `Rain could affect your plans; ${wardrobeRecommendation.detail.replace(/^Your /, 'your ')}` : commuteRelevantNow ? 'Rain could affect your commute, so keep an umbrella handy.' : `Rain could affect your plans ${naturalTime}.`;
    else if (typeof temperature === 'number' && temperature >= 82) summary = wardrobeRecommendation?.score && wardrobeRecommendation.score >= 30 ? `It'll stay warm ${naturalTime}; ${wardrobeRecommendation.detail.replace(/^Your /, 'your ')}` : `It'll stay warm ${naturalTime}, so lighter layers may feel better.`;
    else summary = wardrobeRecommendation?.score && wardrobeRecommendation.score >= 30 ? `It'll stay cold ${naturalTime}; ${wardrobeRecommendation.detail.replace(/^Your /, 'your ')}` : `It'll stay cold ${naturalTime}, so grab an extra layer.`;
  } else if (topInsight?.category === 'traffic' && topInsight.score >= 45) {
    summary = commuteDelay > 0 ? `Your commute is running about ${commuteDelay} minutes longer than usual, so leave extra time.` : `Traffic is moving slower than usual this ${dayPart}.`;
  } else if (topInsight?.category === 'transit' && subway) {
    if (subway.status === 'Service Change') summary = `A service change is affecting the ${subway.line} train, so check your route before leaving.`;
    else if (subway.delayMinutes >= 10) summary = `The ${subway.line} train is about ${subway.delayMinutes} minutes behind schedule, so leave earlier.`;
    else if (subway.delayMinutes > 0) summary = `The ${subway.line} train is running about ${subway.delayMinutes} minutes late.`;
    else summary = `Your ${subway.line} train arrives in about ${subway.nextArrivalMinutes} minutes.`;
  } else if (topInsight?.category === 'sports' && topInsight.score >= 45 && game) {
    const sportsCopy = gameLanguage(game.away, game.home);
    summary = typeof game.minutesUntil === 'number' && game.minutesUntil <= 30 ? `${sentenceCase(sportsCopy.startsIn)} in about ${Math.max(0, game.minutesUntil)} minutes.` : `${sentenceCase(sportsCopy.later)}${game.time ? ` at ${game.time}` : ' soon'}.`;
  }

  return { greeting, headline, insights: sortedInsights, priority, summary };
}

function scenarioTime(now: Date, hour: number, minute = 0) {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export function generateDailyIntelligenceTestSnapshot(baseInput: DailyIntelligenceInput, scenario: DailyIntelligenceTestScenario, now = new Date()): DailyIntelligenceSnapshot {
  if (scenario === 'normal') {
    const input = { ...baseInput, now };
    return { ...generateDailyIntelligence(input), sources: { calendar: input.calendar, commute: input.commute, locker: input.locker, sports: input.sports, traffic: input.traffic, weather: input.weather } };
  }

  let testInput: DailyIntelligenceInput = { ...baseInput, now };
  const normalTraffic = { commute: '28 mins', status: 'Normal', usualMinutes: 28 };
  const laterGame = { favoriteTeams: ['Knicks'], games: ['Knicks vs Celtics 7:00 PM'] };
  const subwayNormal: SubwayCommute = { mode: 'subway', line: 'A', station: '72 St · Central Park West', direction: 'Downtown Manhattan', nextArrivalMinutes: 4, followingArrivalMinutes: 11, status: 'Good Service', delayMinutes: 0 };
  if (scenario === 'rain') testInput = { ...testInput, now: scenarioTime(now, 8, 15), weather: { condition: 'Rainy', temperature: 64 }, traffic: normalTraffic, sports: laterGame };
  else if (scenario === 'cold') testInput = { ...testInput, now: scenarioTime(now, 8, 15), weather: { condition: 'Clear', temperature: 28 }, traffic: normalTraffic, sports: laterGame };
  else if (scenario === 'hot') testInput = { ...testInput, now: scenarioTime(now, 15, 0), weather: { condition: 'Sunny', temperature: 94 }, traffic: normalTraffic, sports: laterGame };
  else if (scenario === 'heavy-traffic') testInput = { ...testInput, now: scenarioTime(now, 8, 10), weather: { condition: 'Sunny', temperature: 72 }, traffic: { commute: '52 mins', status: 'Heavy traffic', usualMinutes: 28 }, sports: laterGame };
  else if (scenario === 'game-soon') testInput = { ...testInput, now: scenarioTime(now, 18, 40), weather: { condition: 'Clear', temperature: 72 }, traffic: normalTraffic, sports: { favoriteTeams: ['Knicks'], games: ['Knicks vs Celtics 7:00 PM'] } };
  else if (scenario === 'multiple-issues') testInput = { ...testInput, now: scenarioTime(now, 8, 15), weather: { condition: 'Rainy', temperature: 61 }, traffic: { commute: '58 mins', status: 'Heavy traffic', usualMinutes: 28 }, sports: laterGame };
  else if (scenario === 'subway-normal') testInput = { ...testInput, commute: subwayNormal, now: scenarioTime(now, 8, 15), sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  else if (scenario === 'subway-delay') testInput = { ...testInput, commute: { ...subwayNormal, nextArrivalMinutes: 12, followingArrivalMinutes: 20, status: 'Delayed', delayMinutes: 12 }, now: scenarioTime(now, 8, 15), sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  else if (scenario === 'major-subway-delay') testInput = { ...testInput, commute: { ...subwayNormal, nextArrivalMinutes: 24, followingArrivalMinutes: 34, status: 'Major Delays', delayMinutes: 24 }, now: scenarioTime(now, 8, 15), sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  else if (scenario === 'service-change') testInput = { ...testInput, commute: { ...subwayNormal, nextArrivalMinutes: 10, followingArrivalMinutes: 18, status: 'Service Change', delayMinutes: 8, serviceChanges: ['Downtown A trains are running local between 59 St and Canal St.'], detour: 'Allow extra time or use the C train.' }, now: scenarioTime(now, 8, 15), sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  else if (scenario === 'rain-subway-delay') testInput = { ...testInput, commute: { ...subwayNormal, nextArrivalMinutes: 14, followingArrivalMinutes: 23, status: 'Delayed', delayMinutes: 14 }, now: scenarioTime(now, 8, 15), sports: laterGame, traffic: normalTraffic, weather: { condition: 'Rainy', temperature: 61 } };
  else if (scenario === 'event-later') {
    const testNow = scenarioTime(now, 9, 0);
    testInput = { ...testInput, calendar: { events: [createMockCalendarEvent(testNow, { title: 'Dinner reservation', type: 'dinner', location: 'West Village', travelRequired: true, preferredCommuteMode: 'subway', importance: 'high' }, 360)] }, commute: undefined, now: testNow, sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  } else if (scenario === 'event-soon') {
    const testNow = scenarioTime(now, 8, 0);
    testInput = { ...testInput, calendar: { events: [createMockCalendarEvent(testNow, { title: 'Doctor appointment', type: 'appointment', location: 'Midtown', travelRequired: true, preferredCommuteMode: 'driving', importance: 'high' }, 50)] }, commute: undefined, now: testNow, sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  } else if (scenario === 'event-subway-delay') {
    const testNow = scenarioTime(now, 8, 0);
    testInput = { ...testInput, calendar: { events: [createMockCalendarEvent(testNow, { title: 'Client meeting', type: 'meeting', location: 'Downtown Manhattan', travelRequired: true, preferredCommuteMode: 'subway', importance: 'high' }, 60)] }, commute: { ...subwayNormal, status: 'Delayed', delayMinutes: 12, nextArrivalMinutes: 12 }, now: testNow, sports: laterGame, traffic: normalTraffic, weather: { condition: 'Sunny', temperature: 72 } };
  } else if (scenario === 'event-heavy-traffic') {
    const testNow = scenarioTime(now, 8, 0);
    testInput = { ...testInput, calendar: { events: [createMockCalendarEvent(testNow, { title: 'Work presentation', type: 'work', location: 'Madison Square', travelRequired: true, preferredCommuteMode: 'driving', importance: 'high' }, 60)] }, commute: undefined, now: testNow, sports: laterGame, traffic: { commute: '52 mins', status: 'Heavy traffic', usualMinutes: 28 }, weather: { condition: 'Sunny', temperature: 72 } };
  } else if (scenario === 'event-rain') {
    const testNow = scenarioTime(now, 8, 0);
    testInput = { ...testInput, calendar: { events: [createMockCalendarEvent(testNow, { title: 'Morning appointment', type: 'appointment', location: 'Upper East Side', travelRequired: true, preferredCommuteMode: 'walking', importance: 'high' }, 60)] }, commute: undefined, now: testNow, sports: laterGame, traffic: normalTraffic, weather: { condition: 'Rainy', temperature: 61 } };
  } else if (scenario === 'event-rain-subway-delay') {
    const testNow = scenarioTime(now, 8, 0);
    testInput = { ...testInput, calendar: { events: [createMockCalendarEvent(testNow, { title: 'Project meeting', type: 'meeting', location: 'Downtown Manhattan', travelRequired: true, preferredCommuteMode: 'subway', importance: 'high' }, 60)] }, commute: { ...subwayNormal, status: 'Delayed', delayMinutes: 14, nextArrivalMinutes: 14 }, now: testNow, sports: laterGame, traffic: normalTraffic, weather: { condition: 'Rainy', temperature: 61 } };
  }

  return {
    ...generateDailyIntelligence(testInput),
    sources: { calendar: testInput.calendar, commute: testInput.commute, locker: testInput.locker, sports: testInput.sports, traffic: testInput.traffic, weather: testInput.weather },
  };
}

export async function readDailyLockerContext(): Promise<DailyLockerContext | undefined> {
  try {
    const stored = await AsyncStorage.getItem(WARDROBE_STORAGE_KEY);
    if (!stored) return undefined;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return undefined;
    const items = parsed.filter((item): item is DailyWardrobeItem => {
      if (typeof item !== 'object' || item === null) return false;
      const candidate = item as Partial<DailyWardrobeItem>;
      return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.brand === 'string' && typeof candidate.primaryColor === 'string' && typeof candidate.favorite === 'boolean' && ['Shirts', 'Pants', 'Shoes', 'Jackets', 'Accessories'].includes(candidate.category ?? '');
    });
    return { itemCount: items.length, favoriteCount: items.filter((item) => item.favorite).length, items };
  } catch {
    return undefined;
  }
}

export async function getDailyIntelligence(now = new Date()): Promise<DailyIntelligenceSnapshot> {
  // Calendar, sports, traffic, and transit currently expose MVP fixtures only.
  // Normal mode intentionally omits them; the same fixtures remain available through TEST MODE.
  const [weatherResult, lockerResult] = await Promise.allSettled([
    getWeather(),
    readDailyLockerContext(),
  ]);

  const weather = weatherResult.status === 'fulfilled'
    ? { condition: getWeatherCondition(weatherResult.value.weatherCode), temperature: weatherResult.value.temperature }
    : undefined;
  const locker = lockerResult.status === 'fulfilled' ? lockerResult.value : undefined;
  const briefing = generateDailyIntelligence({ now, weather, locker });

  return { ...briefing, sources: { locker, weather } };
}
