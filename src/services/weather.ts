export type WeatherDataProvenance = 'live' | 'mock' | 'unavailable';

export type WeatherLocation = {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type WeatherCurrentConditions = {
  temperature: number;
  feelsLike?: number;
  high?: number;
  low?: number;
  condition: string;
  weatherCode: number;
  precipitationChance?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  observedAt?: string;
};

export type WeatherHourlyForecast = {
  time: string;
  temperature: number;
  feelsLike?: number;
  condition: string;
  weatherCode: number;
  precipitationChance?: number;
  humidity?: number;
  windSpeed?: number;
};

export type WeatherDailyForecast = {
  date: string;
  condition: string;
  weatherCode: number;
  high: number;
  low: number;
  precipitationChance?: number;
  sunrise?: string;
  sunset?: string;
};

export type WeatherAlert = {
  id: string;
  title: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  description: string;
  startsAt?: string;
  endsAt?: string;
};

export type WeatherSnapshot = {
  location: WeatherLocation;
  current: WeatherCurrentConditions;
  hourly: WeatherHourlyForecast[];
  daily: WeatherDailyForecast[];
  alerts: WeatherAlert[];
  updatedAt: string;
  dataProvider: string;
};

export type WeatherDataResult =
  | { data: WeatherSnapshot; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export type WeatherQuery = Pick<WeatherLocation, 'id' | 'name' | 'region' | 'latitude' | 'longitude'>;

export interface WeatherDataProvider {
  readonly provenance: 'live' | 'mock';
  getWeather(query: WeatherQuery): Promise<WeatherSnapshot>;
}

export const DEFAULT_WEATHER_LOCATION: WeatherQuery = {
  id: 'new-york',
  name: 'New York',
  region: 'NY',
  latitude: 40.7128,
  longitude: -74.006,
};

type OpenMeteoResponse = {
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
  current?: Record<string, unknown> | null;
  hourly?: Record<string, unknown> | null;
  daily?: Record<string, unknown> | null;
};

const OPEN_METEO_PROVIDER = 'Open-Meteo';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function valueAt(values: unknown, index: number): unknown {
  return Array.isArray(values) ? values[index] : undefined;
}

function requiredNumber(value: unknown, field: string): number {
  if (!isFiniteNumber(value)) throw new Error(`Open-Meteo returned an invalid ${field}.`);
  return value;
}

function buildOpenMeteoUrl(query: WeatherQuery): string {
  const params = new URLSearchParams({
    latitude: String(query.latitude),
    longitude: String(query.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    forecast_days: '7',
    timezone: 'auto',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function parseWeatherResponse(value: unknown, query: WeatherQuery): WeatherSnapshot {
  if (typeof value !== 'object' || value === null) throw new Error('Open-Meteo returned an invalid response.');
  const response = value as OpenMeteoResponse;
  if (!response.current || typeof response.current !== 'object') throw new Error('Open-Meteo did not return current weather data.');

  const currentTemperature = requiredNumber(response.current.temperature_2m, 'temperature');
  const currentCode = requiredNumber(response.current.weather_code, 'weather code');
  const dailyHigh = optionalNumber(valueAt(response.daily?.temperature_2m_max, 0));
  const dailyLow = optionalNumber(valueAt(response.daily?.temperature_2m_min, 0));
  const hourlyPrecipitation = optionalNumber(valueAt(response.hourly?.precipitation_probability, 0));

  const hourlyTimes = Array.isArray(response.hourly?.time) ? response.hourly.time : [];
  const hourly = hourlyTimes.flatMap((time, index): WeatherHourlyForecast[] => {
    const temperature = valueAt(response.hourly?.temperature_2m, index);
    const weatherCode = valueAt(response.hourly?.weather_code, index);
    if (typeof time !== 'string' || !isFiniteNumber(temperature) || !isFiniteNumber(weatherCode)) return [];
    return [{
      time,
      temperature: Math.round(temperature),
      feelsLike: optionalNumber(valueAt(response.hourly?.apparent_temperature, index)),
      condition: getWeatherCondition(weatherCode),
      weatherCode,
      precipitationChance: optionalNumber(valueAt(response.hourly?.precipitation_probability, index)),
      humidity: optionalNumber(valueAt(response.hourly?.relative_humidity_2m, index)),
      windSpeed: optionalNumber(valueAt(response.hourly?.wind_speed_10m, index)),
    }];
  });

  const dailyTimes = Array.isArray(response.daily?.time) ? response.daily.time : [];
  const daily = dailyTimes.flatMap((date, index): WeatherDailyForecast[] => {
    const high = valueAt(response.daily?.temperature_2m_max, index);
    const low = valueAt(response.daily?.temperature_2m_min, index);
    const weatherCode = valueAt(response.daily?.weather_code, index);
    if (typeof date !== 'string' || !isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(weatherCode)) return [];
    const sunrise = valueAt(response.daily?.sunrise, index);
    const sunset = valueAt(response.daily?.sunset, index);
    return [{
      date,
      condition: getWeatherCondition(weatherCode),
      weatherCode,
      high: Math.round(high),
      low: Math.round(low),
      precipitationChance: optionalNumber(valueAt(response.daily?.precipitation_probability_max, index)),
      sunrise: typeof sunrise === 'string' ? sunrise : undefined,
      sunset: typeof sunset === 'string' ? sunset : undefined,
    }];
  });

  return {
    location: {
      ...query,
      latitude: optionalNumber(response.latitude) ?? query.latitude,
      longitude: optionalNumber(response.longitude) ?? query.longitude,
      timezone: typeof response.timezone === 'string' ? response.timezone : undefined,
    },
    current: {
      temperature: Math.round(currentTemperature),
      feelsLike: optionalNumber(response.current.apparent_temperature),
      high: dailyHigh === undefined ? undefined : Math.round(dailyHigh),
      low: dailyLow === undefined ? undefined : Math.round(dailyLow),
      condition: getWeatherCondition(currentCode),
      weatherCode: currentCode,
      precipitationChance: hourlyPrecipitation,
      humidity: optionalNumber(response.current.relative_humidity_2m),
      windSpeed: optionalNumber(response.current.wind_speed_10m),
      windDirection: optionalNumber(response.current.wind_direction_10m),
      observedAt: typeof response.current.time === 'string' ? response.current.time : undefined,
    },
    hourly,
    daily,
    alerts: [],
    updatedAt: new Date().toISOString(),
    dataProvider: OPEN_METEO_PROVIDER,
  };
}

export const openMeteoWeatherProvider: WeatherDataProvider = {
  provenance: 'live',
  async getWeather(query) {
    let response: Response;
    try {
      response = await fetch(buildOpenMeteoUrl(query));
    } catch {
      throw new Error('Unable to retrieve weather from Open-Meteo.');
    }
    if (!response.ok) throw new Error(`Open-Meteo request failed with status ${response.status}.`);
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('Open-Meteo returned malformed JSON.');
    }
    return parseWeatherResponse(data, query);
  },
};

export const mockWeatherProvider: WeatherDataProvider = {
  provenance: 'mock',
  async getWeather(query) {
    return {
      location: { ...query, timezone: 'America/New_York' },
      current: { temperature: 72, feelsLike: 73, high: 77, low: 65, condition: 'Cloudy', weatherCode: 3, precipitationChance: 12, humidity: 62, windSpeed: 8 },
      hourly: [], daily: [], alerts: [], updatedAt: new Date().toISOString(), dataProvider: 'LookUP local weather fixture',
    };
  },
};

export async function getWeather(
  query: WeatherQuery = DEFAULT_WEATHER_LOCATION,
  provider: WeatherDataProvider = openMeteoWeatherProvider,
): Promise<WeatherDataResult> {
  try {
    return { data: await provider.getWeather(query), error: null, provenance: provider.provenance };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Weather information is currently unavailable.',
      provenance: 'unavailable',
    };
  }
}

export function getWeatherForIntelligence(
  result: WeatherDataResult,
  options: { allowMock?: boolean } = {},
): { condition: string; temperature: number } | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;
  return { condition: result.data.current.condition, temperature: result.data.current.temperature };
}

export function getWeatherCondition(code: number): string {
  if (!Number.isFinite(code)) return 'Conditions unavailable';
  if (code === 0) return 'Sunny';
  if (code >= 1 && code <= 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rainy';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snowy';
  if (code >= 95 && code <= 99) return 'Thunderstorms';
  return 'Conditions unavailable';
}
