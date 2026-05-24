import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private config: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      return this.getStatus(key, true, { message: 'REDIS_URL not configured' });
    }

    const client = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    try {
      await client.ping();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { error }));
    } finally {
      await client.quit();
    }
  }
}
