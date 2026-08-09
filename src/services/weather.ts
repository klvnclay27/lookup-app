const OPEN_METEO_CURRENT_WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true&temperature_unit=fahrenheit';

type WeatherData = {
  temperature: number;
  weatherCode: number;
};

type OpenMeteoResponse = {
  current_weather?: {
    temperature?: unknown;
    weathercode?: unknown;
  } | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseWeatherResponse(value: unknown): WeatherData {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Open-Meteo returned an invalid response.');
  }

  const { current_weather: currentWeather } = value as OpenMeteoResponse;
  if (!currentWeather || typeof currentWeather !== 'object') {
    throw new Error('Open-Meteo did not return current weather data.');
  }

  if (!isFiniteNumber(currentWeather.temperature)) {
    throw new Error('Open-Meteo returned an invalid temperature.');
  }

  if (!isFiniteNumber(currentWeather.weathercode)) {
    throw new Error('Open-Meteo returned an invalid weather code.');
  }

  return {
    temperature: Math.round(currentWeather.temperature),
    weatherCode: currentWeather.weathercode,
  };
}

export async function getWeather(): Promise<WeatherData> {
  try {
    const response = await fetch(OPEN_METEO_CURRENT_WEATHER_URL);

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}.`);
    }

    const data: unknown = await response.json();
    return parseWeatherResponse(data);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Open-Meteo')) {
      throw error;
    }

    throw new Error('Unable to retrieve weather from Open-Meteo.');
  }
}

export function getWeatherCondition(code: number): string {
  if (!Number.isFinite(code)) return 'Conditions unavailable';
  if (code === 0) return 'Sunny';
  if (code >= 1 && code <= 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 85 && code <= 86) return 'Snowy';
  if (code >= 95 && code <= 99) return 'Thunderstorms';
  return 'Conditions unavailable';
}
