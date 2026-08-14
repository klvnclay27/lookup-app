import type { OutfitSelection, WardrobeItem } from '@/services/my-locker';
import type { WeatherCurrentConditions, WeatherDailyForecast } from '@/services/weather';

export type OutfitWeatherProfile = 'hot' | 'mild' | 'cold' | 'rain' | 'snow';

export type WeatherOutfitRecommendation = {
  complete: boolean;
  profile: OutfitWeatherProfile;
  recommendation: string;
  selection: OutfitSelection;
  weatherLabel: string;
};

export type WeeklyOutfitOccasion = 'work' | 'everyday';

export type WeeklyOutfitDay = WeatherOutfitRecommendation & {
  date: string;
  dayLabel: string;
  missingCategories: string[];
  occasionLabel: string;
};

const emptySelection = (): OutfitSelection => ({ top: null, jacket: null, bottom: null, shoes: null, accessory: null });

function itemText(item: WardrobeItem) {
  return `${item.name} ${item.primaryColor} ${item.brand}`.toLowerCase();
}

function pickBest(wardrobe: WardrobeItem[], category: WardrobeItem['category'], preferredTerms: string[]) {
  const candidates = wardrobe.filter((item) => item.category === category);
  return candidates
    .map((item, index) => ({
      item,
      index,
      score: preferredTerms.reduce(
        (score, term, termIndex) => score + (itemText(item).includes(term) ? preferredTerms.length - termIndex : 0),
        item.favorite ? 1 : 0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.item ?? null;
}

function pickWeeklyItem(
  wardrobe: WardrobeItem[],
  category: WardrobeItem['category'],
  weatherTerms: string[],
  occasionTerms: string[],
  discouragedTerms: string[],
  usage: Map<string, number>,
) {
  const candidates = wardrobe.filter((item) => item.category === category);
  const selected = candidates
    .map((item, index) => {
      const text = itemText(item);
      const weatherScore = weatherTerms.reduce(
        (score, term, termIndex) => score + (text.includes(term) ? (weatherTerms.length - termIndex) * 10 : 0),
        0,
      );
      const occasionScore = occasionTerms.reduce(
        (score, term, termIndex) => score + (text.includes(term) ? (occasionTerms.length - termIndex) * 8 : 0),
        0,
      );
      const casualPenalty = discouragedTerms.reduce(
        (score, term, termIndex) => score + (text.includes(term) ? (discouragedTerms.length - termIndex) * 12 : 0),
        0,
      );
      return {
        item,
        index,
        score: weatherScore + occasionScore - casualPenalty - (usage.get(item.id) ?? 0) * 12 + (item.favorite ? 1 : 0),
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.item ?? null;

  if (selected) usage.set(selected.id, (usage.get(selected.id) ?? 0) + 1);
  return selected;
}

function getWeatherProfile(weather: WeatherCurrentConditions): OutfitWeatherProfile {
  const condition = weather.condition.toLowerCase();
  const isSnow = condition.includes('snow')
    || (weather.weatherCode >= 71 && weather.weatherCode <= 77)
    || (weather.weatherCode >= 85 && weather.weatherCode <= 86);
  const isRain = condition.includes('rain')
    || condition.includes('drizzle')
    || condition.includes('thunder')
    || (weather.weatherCode >= 51 && weather.weatherCode <= 67)
    || (weather.weatherCode >= 80 && weather.weatherCode <= 82)
    || weather.weatherCode >= 95;

  if (isSnow || weather.temperature <= 32) return 'snow';
  if (isRain || (weather.precipitationChance ?? 0) >= 55) return 'rain';
  if (weather.temperature >= 80) return 'hot';
  if (weather.temperature <= 50) return 'cold';
  return 'mild';
}

const preferences: Record<OutfitWeatherProfile, {
  top: string[];
  bottom: string[];
  shoes: string[];
  jacket: string[];
  guidance: string;
}> = {
  hot: {
    top: ['tee', 't-shirt', 'polo', 'lightweight', 'shirt'],
    bottom: ['shorts', 'light', 'chino', 'pants'],
    shoes: ['running', 'sneaker', 'breathable'],
    jacket: [],
    guidance: 'Lightweight layers, comfortable bottoms, and breathable shoes should work well.',
  },
  mild: {
    top: ['polo', 'tee', 't-shirt', 'oxford', 'shirt'],
    bottom: ['chino', 'jeans', 'pants'],
    shoes: ['sneaker', 'running', 'shoe'],
    jacket: ['light', 'denim', 'jacket'],
    guidance: 'A light top, jeans or chinos, and comfortable shoes should work well.',
  },
  cold: {
    top: ['hoodie', 'sweater', 'knit', 'long sleeve', 'shirt'],
    bottom: ['jeans', 'chino', 'jogger', 'pants'],
    shoes: ['boot', 'dress shoe', 'sneaker', 'shoe'],
    jacket: ['coat', 'puffer', 'bomber', 'jacket', 'blazer'],
    guidance: 'Warm layers, pants, and closed shoes will be the most useful.',
  },
  rain: {
    top: ['hoodie', 'polo', 'tee', 'shirt'],
    bottom: ['chino', 'jeans', 'pants'],
    shoes: ['boot', 'waterproof', 'sneaker', 'shoe'],
    jacket: ['rain', 'waterproof', 'shell', 'bomber', 'jacket'],
    guidance: 'A protective outer layer, pants, and weather-appropriate shoes will help with the rain.',
  },
  snow: {
    top: ['sweater', 'hoodie', 'knit', 'long sleeve', 'shirt'],
    bottom: ['jeans', 'chino', 'jogger', 'pants'],
    shoes: ['snow boot', 'boot', 'waterproof', 'closed', 'shoe'],
    jacket: ['coat', 'puffer', 'parka', 'bomber', 'jacket'],
    guidance: 'Warm layers, a coat, pants, and appropriate closed footwear are important today.',
  },
};

export function buildWeatherOutfitRecommendation(
  weather: WeatherCurrentConditions,
  wardrobe: WardrobeItem[],
): WeatherOutfitRecommendation {
  const profile = getWeatherProfile(weather);
  const preferred = preferences[profile];
  const selection = emptySelection();

  selection.top = pickBest(wardrobe, 'Shirts', preferred.top);
  selection.bottom = pickBest(wardrobe, 'Pants', preferred.bottom);
  selection.shoes = pickBest(wardrobe, 'Shoes', preferred.shoes);

  const windy = (weather.windSpeed ?? 0) >= 18;
  if (profile === 'cold' || profile === 'rain' || profile === 'snow' || windy) {
    selection.jacket = pickBest(wardrobe, 'Jackets', preferred.jacket.length > 0 ? preferred.jacket : ['jacket', 'coat']);
  }

  const complete = Boolean(selection.top && selection.bottom && selection.shoes);
  const itemNames = [selection.top, selection.bottom, selection.shoes, selection.jacket]
    .filter((item): item is WardrobeItem => Boolean(item))
    .map((item) => item.name);

  return {
    complete,
    profile,
    recommendation: complete
      ? `Try your ${itemNames.join(' + ')}.`
      : `${preferred.guidance} Your Locker doesn't have enough weather-ready pieces yet.`,
    selection,
    weatherLabel: `${Math.round(weather.temperature)}°F • ${weather.condition}`,
  };
}

const occasionPreferences: Record<WeeklyOutfitOccasion, {
  top: string[];
  bottom: string[];
  shoes: string[];
  jacket: string[];
}> = {
  work: {
    top: ['oxford', 'button-down', 'button', 'polo', 'sweater', 'knit', 'shirt', 'blouse'],
    bottom: ['chino', 'trouser', 'dress pant', 'slack', 'pants', 'dark jeans', 'jeans'],
    shoes: ['dress shoe', 'loafer', 'oxford shoe', 'boot', 'simple sneaker', 'sneaker'],
    jacket: ['blazer', 'coat', 'jacket', 'bomber'],
  },
  everyday: {
    top: ['tee', 't-shirt', 'hoodie', 'polo', 'shirt'],
    bottom: ['jeans', 'jogger', 'shorts', 'chino', 'pants'],
    shoes: ['sneaker', 'running', 'boot', 'shoe'],
    jacket: ['denim', 'bomber', 'jacket', 'coat'],
  },
};

const workDiscouragedTerms = {
  top: ['hoodie', 'sweatshirt', 'athletic', 'gym'],
  bottom: ['jogger', 'sweatpant', 'athletic short', 'gym short'],
  shoes: ['running', 'athletic', 'trainer', 'gym'],
  jacket: [] as string[],
};

function forecastTemperature(forecast: WeatherDailyForecast) {
  if (forecast.low <= 32) return forecast.low;
  if (forecast.high >= 80) return forecast.high;
  return Math.round((forecast.high + forecast.low) / 2);
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
}

function isWeekday(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day !== 0 && day !== 6;
}

function weekdayOrder(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 ? 7 : day;
}

export function buildWeeklyOutfitPlan(
  forecast: WeatherDailyForecast[],
  wardrobe: WardrobeItem[],
  occasion: WeeklyOutfitOccasion,
  maximumDays = 5,
): WeeklyOutfitDay[] {
  const usage = new Map<string, number>();
  const occasionTerms = occasionPreferences[occasion];
  const discouragedTerms = occasion === 'work'
    ? workDiscouragedTerms
    : { top: [], bottom: [], shoes: [], jacket: [] };
  const relevantForecast = occasion === 'work'
    ? forecast.filter((day) => isWeekday(day.date)).sort((a, b) => weekdayOrder(a.date) - weekdayOrder(b.date))
    : [...forecast].sort((a, b) => a.date.localeCompare(b.date));

  return relevantForecast.slice(0, maximumDays).map((day) => {
    const weather: WeatherCurrentConditions = {
      temperature: forecastTemperature(day),
      high: day.high,
      low: day.low,
      condition: day.condition,
      weatherCode: day.weatherCode,
      precipitationChance: day.precipitationChance,
    };
    const profile = getWeatherProfile(weather);
    const preferred = preferences[profile];
    const selection = emptySelection();

    selection.top = pickWeeklyItem(wardrobe, 'Shirts', preferred.top, occasionTerms.top, discouragedTerms.top, usage);
    selection.bottom = pickWeeklyItem(wardrobe, 'Pants', preferred.bottom, occasionTerms.bottom, discouragedTerms.bottom, usage);
    selection.shoes = pickWeeklyItem(wardrobe, 'Shoes', preferred.shoes, occasionTerms.shoes, discouragedTerms.shoes, usage);

    const needsOuterwear = profile === 'cold' || profile === 'rain' || profile === 'snow';
    if (needsOuterwear) {
      selection.jacket = pickWeeklyItem(wardrobe, 'Jackets', preferred.jacket, occasionTerms.jacket, discouragedTerms.jacket, usage);
    }

    const missingCategories = [
      !selection.top ? 'top' : null,
      !selection.bottom ? 'bottom' : null,
      !selection.shoes ? 'shoes' : null,
      needsOuterwear && !selection.jacket ? 'weather-ready outer layer' : null,
    ].filter((value): value is string => Boolean(value));
    const complete = Boolean(selection.top && selection.bottom && selection.shoes);
    const names = [selection.top, selection.bottom, selection.shoes, selection.jacket]
      .filter((item): item is WardrobeItem => Boolean(item))
      .map((item) => item.name);

    return {
      complete,
      date: day.date,
      dayLabel: dayLabel(day.date),
      missingCategories,
      occasionLabel: occasion === 'work' ? 'Work' : 'Everyday',
      profile,
      recommendation: missingCategories.length > 0
        ? `Consider adding ${missingCategories.join(', ')} for this day's weather.`
        : names.join(' + '),
      selection,
      weatherLabel: `${Math.round(day.high)}°F • ${day.condition}`,
    };
  });
}
