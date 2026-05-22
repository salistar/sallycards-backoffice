import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface WeatherResult {
  temperature: number;
  condition: 'clear' | 'clouds' | 'rain' | 'storm' | 'snow';
  windKmh: number;
  precipitation: number;
  humidity: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  async getWeather(lat: number, lng: number): Promise<WeatherResult> {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    // 1) Cache
    const cached = await this.conn.collection('weather_cache').findOne({ key });
    if (cached && Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS) {
      return cached.data as WeatherResult;
    }

    // 2) Provider réel si clé configurée (OpenWeatherMap)
    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY');
    let result: WeatherResult;
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        const j: any = await res.json();
        result = {
          temperature: j.main?.temp ?? 20,
          condition: this.mapCondition(j.weather?.[0]?.main),
          windKmh: Math.round((j.wind?.speed ?? 0) * 3.6),
          precipitation: j.rain?.['1h'] ? Math.min(100, Math.round(j.rain['1h'] * 10)) : 0,
          humidity: j.main?.humidity ?? 50,
        };
      } catch (e) {
        this.logger.warn(`OpenWeather fetch failed: ${(e as Error).message}`);
        result = this.mock(lat, lng);
      }
    } else {
      result = this.mock(lat, lng);
    }

    // 3) Met en cache
    await this.conn.collection('weather_cache').updateOne(
      { key },
      { $set: { key, data: result, cachedAt: new Date() } },
      { upsert: true },
    );
    return result;
  }

  private mapCondition(main?: string): WeatherResult['condition'] {
    const m = (main ?? '').toLowerCase();
    if (m.includes('thunder') || m.includes('storm')) return 'storm';
    if (m.includes('rain') || m.includes('drizzle')) return 'rain';
    if (m.includes('snow')) return 'snow';
    if (m.includes('cloud')) return 'clouds';
    return 'clear';
  }

  /** Météo déterministe (sans clé API) — assez stable pour démo/dev. */
  private mock(lat: number, lng: number): WeatherResult {
    const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
    const frac = seed - Math.floor(seed);
    const conditions: WeatherResult['condition'][] = ['clear', 'clouds', 'rain', 'clear', 'clouds'];
    return {
      temperature: Math.round(14 + frac * 16),       // 14..30°C
      condition: conditions[Math.floor(frac * conditions.length)],
      windKmh: Math.round(5 + frac * 25),
      precipitation: Math.round(frac * 40),
      humidity: Math.round(40 + frac * 50),
    };
  }
}
