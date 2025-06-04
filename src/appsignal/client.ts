import { getAuthToken } from './auth';
import { ErrorSample, SampleFilters, SampleResponse, SamplesResponse, AppSignalError } from './types';
import { loadConfig } from '../utils/config';
import { logger } from '../utils/logger';

const config = loadConfig();
const BASE_URL = 'https://appsignal.com/api';

/**
 * Fetches a specific sample by ID
 * @param sampleId The sample ID
 * @param appId The AppSignal application ID
 * @returns The sample data
 */
export async function fetchErrorSample(sampleId: string, appId: string): Promise<ErrorSample> {
  if (!appId) {
    throw new Error('AppSignal application ID is required.');
  }

  logger.debug(`Fetching error sample ${sampleId} from AppSignal API`);

  const token = getAuthToken(config);
  const url = `${BASE_URL}/${appId}/samples/${sampleId}.json?token=${token}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const error: AppSignalError = {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        message: `Failed to fetch error sample ${sampleId}: ${response.status} ${response.statusText}`,
      };
      throw error;
    }

    const data = await response.json() as ErrorSample;
    return data;
  } catch (error: any) {
    if (error.status) {
      // This is already an AppSignalError
      throw error;
    }
    
    // This is some other error (network, etc)
    logger.error(`Error fetching AppSignal error sample:`, error);
    throw {
      status: 500,
      statusText: 'Internal Server Error',
      message: `Failed to fetch error sample ${sampleId}: ${error.message}`,
    };
  }
}

/**
 * Searches for error samples with the given filters
 * @param filters Object containing search criteria
 * @param appId The AppSignal application ID
 * @returns List of samples matching the criteria
 */
export async function searchErrorSamples(filters: SampleFilters, appId: string): Promise<SamplesResponse> {
  if (!appId) {
    throw new Error('AppSignal application ID is required.');
  }

  logger.debug(`Searching error samples in AppSignal API with filters:`, filters);

  const token = getAuthToken(config);
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add auth token
  queryParams.append('token', token);
  
  if (filters.action_id) queryParams.append('action_id', filters.action_id);
  if (filters.exception) queryParams.append('exception', filters.exception);
  if (filters.since) queryParams.append('since', filters.since.toString());
  if (filters.before) queryParams.append('before', filters.before.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.count_only) queryParams.append('count_only', filters.count_only.toString());
  
  const url = `${BASE_URL}/${appId}/samples/errors.json?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const error: AppSignalError = {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        message: `Failed to search error samples: ${response.status} ${response.statusText}`,
      };
      throw error;
    }

    const data = await response.json() as SamplesResponse;
    return data;
  } catch (error: any) {
    if (error.status) {
      // This is already an AppSignalError
      throw error;
    }
    
    // This is some other error (network, etc)
    logger.error(`Error searching AppSignal error samples:`, error);
    throw {
      status: 500,
      statusText: 'Internal Server Error',
      message: `Failed to search error samples: ${error.message}`,
    };
  }
}