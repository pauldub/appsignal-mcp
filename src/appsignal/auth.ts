import { Config } from '../utils/config';
import { logger } from '../utils/logger';

export function getAuthToken(config: Config): string {
  if (!config.appsignal.apiToken) {
    logger.error('AppSignal credentials not configured');
    throw new Error('AppSignal API token not configured. Please set APPSIGNAL_API_TOKEN environment variable.');
  }

  return config.appsignal.apiToken;
}