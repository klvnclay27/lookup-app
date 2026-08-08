import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ClothingItem } from '@/constants/starter-wardrobe';
import { getSports } from '@/services/sports';
import { getTraffic } from '@/services/traffic';
import { getWeather, getWeatherCondition } from '@/services/weather';

export type IntelligencePriority = 'routine' | 'useful' | 'important';
export type DailyWardrobeItem = Pick<ClothingItem, 'brand' | 'category' | 'favorite' | 'id' | 'name' | 'primaryColor'>;
export type DailyLockerContext = { favoriteCount?: number; itemCount?: number; items?: DailyWardrobeItem[] };
export type WardrobeRecommendation = { detail: string; itemNames: string[]; score: number; title: string };
export type DailyIntelligenceInput = {
  now?: Date;
  userName?: string;
  weather?: { condition?: string; temperature?: number };
  traffic?: { commute?: string; status?: string; usualMinutes?: number };
  music?: { playlist?: string; tracks?: string[] };
  sports?: { favoriteTeams?: string[]; games?: string[] };
  locker?: DailyLockerContext;
};
export type DailyInsight = {
  category: 'weather' | 'traffic' | 'sports' | 'music' | 'locker' | 'day';
  detail: string;
  id: string;
  priority: IntelligencePriority;
  score: number;
  title: string;
};
export type DailyIntelligenceResult = { greeting: string; headline: string; insights: DailyInsight[]; priority: IntelligencePriority; summary: string };
export type DailyIntelligenceSnapshot = DailyIntelligenceResult & {
  sources: Pick<DailyIntelligenceInput, 'locker' | 'sports' | 'traffic' | 'weather'>;
};
export const DAILY_INTELLIGENCE_TEST_SCENARIOS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Rain', value: 'rain' },
  { label: 'Cold', value: 'cold' },
  { label: 'Hot', value: 'hot' },
  { label: 'Heavy Traffic', value: 'heavy-traffic' },
  { label: 'Game Soon', value: 'game-soon' },
  { label: 'Multiple Issues', value: 'multiple-issues' },
] as const;
export type DailyIntelligenceTestScenario = typeof DAILY_INTELLIGENCE_TEST_SCENARIOS[number]['value'];
export type PriorityScoreInput = { base: number; compoundBoost?: number; timeBoost?: number };
export type DailyHeadlineContext = {
  dayPart: 'morning' | 'afternoon' | 'evening';
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

export function buildDailyHeadline({ dayPart, gameTeam, severeWeather, topInsight, secondInsight, wetWeather }: DailyHeadlineContext) {
  const multipleUrgent = Boolean(topInsight && secondInsight && topInsight.score >= 75 && secondInsight.score >= 75);
  if (multipleUrgent) return `A couple things need your attention this ${dayPart}.`;
  if (!topInsight || topInsight.score < 45) return `Everything looks pretty smooth this ${dayPart}.`;

  switch (topInsight.category) {
    case 'weather':
      if (severeWeather) return `Weather is the main thing to watch this ${dayPart}.`;
      if (wetWeather) return `Rain could change your plans this ${dayPart}.`;
      return `The temperature is worth planning around this ${dayPart}.`;
    case 'traffic':
      return `Give yourself some extra time this ${dayPart}.`;
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
  const game = parseGame(input.sports?.games?.find((item) => item.trim().length > 0), now);
  const dayPart = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const naturalTime = hour < 12 ? 'this morning' : hour < 18 ? 'this afternoon' : 'tonight';
  const wardrobeRecommendation = getWardrobeRecommendation({ condition: input.weather?.condition, dayPart, items: input.locker?.items, temperature });

  let weatherBase = severeWeather ? 92 : wet ? 80 : typeof temperature === 'number' && (temperature <= 32 || temperature >= 90) ? 70 : typeof temperature === 'number' && (temperature <= 50 || temperature >= 82) ? 45 : typeof temperature === 'number' ? 18 : 0;
  let trafficBase = commuteDelay >= 20 ? 88 : trafficStatusDelayed ? 78 : commuteDelay >= 10 ? 62 : typeof commute === 'number' ? 22 : 0;
  const weatherAffectsPlans = weatherBase >= 70;
  const trafficAffectsPlans = trafficBase >= 60;
  const compoundBoost = weatherAffectsPlans && trafficAffectsPlans ? 6 : 0;
  const weatherScore = calculatePriorityScore({ base: weatherBase, compoundBoost, timeBoost: wet && commuteRelevantNow ? 8 : 0 });
  const trafficScore = calculatePriorityScore({ base: trafficBase, compoundBoost, timeBoost: trafficAffectsPlans && commuteRelevantNow ? 8 : 0 });
  const insights: DailyInsight[] = [];

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
  const combinedWeatherTraffic = topInsight?.score >= 75 && secondInsight?.score >= 75 && new Set([topInsight.category, secondInsight.category]).size === 2 && [topInsight.category, secondInsight.category].every((category) => category === 'weather' || category === 'traffic');
  const headline = buildDailyHeadline({ dayPart, gameTeam: game?.away, severeWeather, topInsight, secondInsight, wetWeather: wet });

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
  if (wardrobeRecommendation && wardrobeRecommendation.score < 10 && routineBriefingParts.length < 2) {
    routineBriefingParts.push(wardrobeRecommendation.detail.replace(/\.$/, '').replace(/^Your /, 'your '));
  }
  const routineBriefing = routineBriefingParts.length > 1
    ? `${routineBriefingParts.slice(0, -1).join(', ')}, and ${routineBriefingParts[routineBriefingParts.length - 1]}`
    : routineBriefingParts[0];
  let summary = routineBriefing
    ? `Your ${dayPart} looks clear. ${routineBriefing.charAt(0).toUpperCase()}${routineBriefing.slice(1)}.`
    : `Your ${dayPart} briefing will update as data becomes available.`;
  if (combinedWeatherTraffic) summary = `Weather and commute conditions both need attention before you head out this ${dayPart}.`;
  else if (topInsight?.category === 'weather' && topInsight.score >= 45) {
    if (severeWeather) summary = `${input.weather?.condition ?? 'Severe weather'} could disrupt your plans ${naturalTime}.`;
    else if (wet) summary = wardrobeRecommendation?.score && wardrobeRecommendation.score >= 50 ? `Rain could affect your plans; ${wardrobeRecommendation.detail.replace(/^Your /, 'your ')}` : commuteRelevantNow ? 'Rain could affect your commute, so keep an umbrella handy.' : `Rain could affect your plans ${naturalTime}.`;
    else if (typeof temperature === 'number' && temperature >= 82) summary = wardrobeRecommendation?.score && wardrobeRecommendation.score >= 30 ? `It'll stay warm ${naturalTime}; ${wardrobeRecommendation.detail.replace(/^Your /, 'your ')}` : `It'll stay warm ${naturalTime}, so lighter layers may feel better.`;
    else summary = wardrobeRecommendation?.score && wardrobeRecommendation.score >= 30 ? `It'll stay cold ${naturalTime}; ${wardrobeRecommendation.detail.replace(/^Your /, 'your ')}` : `It'll stay cold ${naturalTime}, so grab an extra layer.`;
  } else if (topInsight?.category === 'traffic' && topInsight.score >= 45) {
    summary = commuteDelay > 0 ? `Your commute is running about ${commuteDelay} minutes longer than usual, so leave extra time.` : `Traffic is moving slower than usual this ${dayPart}.`;
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
    return { ...generateDailyIntelligence(input), sources: { locker: input.locker, sports: input.sports, traffic: input.traffic, weather: input.weather } };
  }

  let testInput: DailyIntelligenceInput = { ...baseInput, now };
  const normalTraffic = { commute: '28 mins', status: 'Normal', usualMinutes: 28 };
  const laterGame = { favoriteTeams: ['Knicks'], games: ['Knicks vs Celtics 7:00 PM'] };
  if (scenario === 'rain') testInput = { ...testInput, now: scenarioTime(now, 8, 15), weather: { condition: 'Rainy', temperature: 64 }, traffic: normalTraffic, sports: laterGame };
  else if (scenario === 'cold') testInput = { ...testInput, now: scenarioTime(now, 8, 15), weather: { condition: 'Clear', temperature: 28 }, traffic: normalTraffic, sports: laterGame };
  else if (scenario === 'hot') testInput = { ...testInput, now: scenarioTime(now, 15, 0), weather: { condition: 'Sunny', temperature: 94 }, traffic: normalTraffic, sports: laterGame };
  else if (scenario === 'heavy-traffic') testInput = { ...testInput, now: scenarioTime(now, 8, 10), weather: { condition: 'Sunny', temperature: 72 }, traffic: { commute: '52 mins', status: 'Heavy traffic', usualMinutes: 28 }, sports: laterGame };
  else if (scenario === 'game-soon') testInput = { ...testInput, now: scenarioTime(now, 18, 40), weather: { condition: 'Clear', temperature: 72 }, traffic: normalTraffic, sports: { favoriteTeams: ['Knicks'], games: ['Knicks vs Celtics 7:00 PM'] } };
  else if (scenario === 'multiple-issues') testInput = { ...testInput, now: scenarioTime(now, 8, 15), weather: { condition: 'Rainy', temperature: 61 }, traffic: { commute: '58 mins', status: 'Heavy traffic', usualMinutes: 28 }, sports: laterGame };

  return {
    ...generateDailyIntelligence(testInput),
    sources: { locker: testInput.locker, sports: testInput.sports, traffic: testInput.traffic, weather: testInput.weather },
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

  return { ...briefing, sources: { locker, sports, traffic, weather } };
}
