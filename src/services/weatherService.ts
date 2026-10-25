import { WeatherData } from '../types';

export const GUAYAQUIL_COORDS = {
  lat: -2.1894,
  lng: -79.8891,
  cityName: 'Guayaquil, Ecuador',
  timezone: 'America/Guayaquil',
};

const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export const FALLBACK_WEATHER: WeatherData = {
  source: 'fallback',
  temperatureC: 28.5,
  humidityPct: 86,
  precipitationMm: 14.8,
  rainRateMmH: 26.4,
  windSpeedKmh: 18.2,
  weatherCode: 65,
  weatherDescription: 'Heavy tropical rain showers (Offline Fallback)',
  hourlyTimes: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'],
  hourlyPrecipitation: [2.1, 4.8, 12.5, 28.4, 34.2, 19.8, 8.4, 5.2, 3.1, 1.2],
  hourlyProbability: [40, 65, 85, 95, 95, 80, 50, 45, 30, 20],
  dailyForecast: [
    { date: '2026-10-25', dayName: 'Today', precipSumMm: 48.2, precipProbMax: 95, weatherCode: 65, description: 'Heavy tropical downpour' },
    { date: '2026-10-26', dayName: 'Tomorrow', precipSumMm: 38.5, precipProbMax: 85, weatherCode: 63, description: 'Moderate to heavy rain' },
    { date: '2026-10-27', dayName: 'Tue', precipSumMm: 22.0, precipProbMax: 70, weatherCode: 61, description: 'Scattered afternoon showers' },
    { date: '2026-10-28', dayName: 'Wed', precipSumMm: 14.0, precipProbMax: 60, weatherCode: 80, description: 'Light coastal showers' },
    { date: '2026-10-29', dayName: 'Thu', precipSumMm: 8.5, precipProbMax: 45, weatherCode: 2, description: 'Partly cloudy with brief squall' },
    { date: '2026-10-30', dayName: 'Fri', precipSumMm: 31.0, precipProbMax: 80, weatherCode: 81, description: 'Tropical convergence thunderstorms' },
    { date: '2026-10-31', dayName: 'Sat', precipSumMm: 26.4, precipProbMax: 75, weatherCode: 63, description: 'Persistent estuary showers' },
  ],
  fetchedAt: new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' }) + ' ECT',
};

export async function fetchGuayaquilWeather(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${GUAYAQUIL_COORDS.lat}&longitude=${GUAYAQUIL_COORDS.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation,precipitation_probability&daily=weather_code,precipitation_sum,precipitation_probability_max&timezone=America%2FGuayaquil&forecast_days=7`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6500) });
    if (!res.ok) {
      throw new Error(`Weather service returned HTTP ${res.status}`);
    }
    const data = await res.json();

    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    const code = current.weather_code ?? 61;
    const desc = WMO_CODE_MAP[code] || 'Rainy conditions';

    // Extract next 10 intervals from current hour
    const times: string[] = [];
    const precips: number[] = [];
    const probs: number[] = [];

    const nowIso = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    let startIndex = 0;
    if (Array.isArray(hourly.time)) {
      const idx = hourly.time.findIndex((t: string) => t.startsWith(nowIso));
      if (idx !== -1) startIndex = idx;
    }

    const timeSlice = (hourly.time || []).slice(startIndex, startIndex + 10);
    const precipSlice = (hourly.precipitation || []).slice(startIndex, startIndex + 10);
    const probSlice = (hourly.precipitation_probability || []).slice(startIndex, startIndex + 10);

    timeSlice.forEach((t: string, i: number) => {
      const parts = t.split('T');
      times.push(parts[1] || t);
      precips.push(Number((precipSlice[i] ?? 0).toFixed(1)));
      probs.push(Math.round(probSlice[i] ?? 0));
    });

    // Format daily
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyForecast = (daily.time || []).map((dateStr: string, idx: number) => {
      const d = new Date(dateStr + 'T12:00:00Z');
      const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dayNames[d.getUTCDay()];
      const dCode = daily.weather_code?.[idx] ?? 61;
      return {
        date: dateStr,
        dayName,
        precipSumMm: Number((daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
        precipProbMax: Math.round(daily.precipitation_probability_max?.[idx] ?? 0),
        weatherCode: dCode,
        description: WMO_CODE_MAP[dCode] || 'Rain / Showers',
      };
    });

    return {
      source: 'live',
      temperatureC: current.temperature_2m ?? 27.5,
      humidityPct: current.relative_humidity_2m ?? 85,
      precipitationMm: current.precipitation ?? 0,
      rainRateMmH: current.rain ?? 0,
      windSpeedKmh: current.wind_speed_10m ?? 12,
      weatherCode: code,
      weatherDescription: desc,
      hourlyTimes: times.length > 0 ? times : FALLBACK_WEATHER.hourlyTimes,
      hourlyPrecipitation: precips.length > 0 ? precips : FALLBACK_WEATHER.hourlyPrecipitation,
      hourlyProbability: probs.length > 0 ? probs : FALLBACK_WEATHER.hourlyProbability,
      dailyForecast: dailyForecast.length > 0 ? dailyForecast : FALLBACK_WEATHER.dailyForecast,
      fetchedAt: new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' }) + ' ECT',
    };
  } catch (err) {
    console.warn('Live Open-Meteo API unavailable or timed out; utilizing deterministic fallback weather model.', err);
    return {
      ...FALLBACK_WEATHER,
      fetchedAt: new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' }) + ' ECT (Offline Fallback)',
    };
  }
}
