import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Config } from '../utils/config';
import { logger } from '../utils/logger';
import { fetchSample, searchSamples } from '../appsignal/client';
import { Sample, ErrorSample, PerformanceSample, SampleType } from '../appsignal/types';

/**
 * Format a sample for better readability based on its type
 */
function formatSample(sample: Sample) {
  const isError = sample.is_exception === true;
  
  if (isError) {
    const errorSample = sample as ErrorSample;
    return {
      id: errorSample.id,
      type: 'error',
      action: errorSample.action,
      path: errorSample.path,
      status: errorSample.status,
      duration: errorSample.duration,
      hostname: errorSample.hostname,
      time: errorSample.time,
      environment: errorSample.environment || {},
      params: errorSample.params || {},
      session_data: errorSample.session_data || {},
      tags: errorSample.tags || {},
      exception: errorSample.exception ? {
        message: errorSample.exception.message,
        name: errorSample.exception.name,
        backtrace: errorSample.exception.backtrace || []
      } : null
    };
  } else {
    const perfSample = sample as PerformanceSample;
    return {
      id: perfSample.id,
      type: 'performance',
      action: perfSample.action,
      path: perfSample.path,
      status: perfSample.status,
      duration: perfSample.duration,
      db_runtime: perfSample.db_runtime,
      view_runtime: perfSample.view_runtime,
      hostname: perfSample.hostname,
      time: perfSample.time,
      allocation_count: perfSample.allocation_count,
      environment: perfSample.environment || {},
      params: perfSample.params || {},
      session_data: perfSample.session_data || {},
      events: perfSample.events || []
    };
  }
}

/**
 * Create and start an MCP server using the SDK with stdio transport
 */
export async function startServer(config: Config) {
  // Create the MCP server
  const server = new McpServer({
    name: 'appsignal-mcp',
    version: '1.0.0',
  }, { capabilities: { logging: {} } });

  // Add 'get_sample' tool
  server.tool(
    'get_sample',
    'Get details about a specific AppSignal sample by ID (error or performance)',
    {
      sampleId: z.string().describe('The AppSignal sample ID'),
      appId: z.string().describe('The AppSignal application ID'),
    },
    async ({ sampleId, appId }) => {
      logger.info(`Fetching AppSignal sample: ${sampleId} from app: ${appId}`);
      
      try {
        const sample = await fetchSample(sampleId, appId);
        const formattedSample = formatSample(sample);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedSample, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Error fetching AppSignal sample ${sampleId}:`, error);
        
        // Handle different error cases
        if (error.status === 404) {
          return {
            content: [
              {
                type: 'text',
                text: `Sample ${sampleId} not found`,
              }
            ],
            isError: true,
          };
        }
        
        if (error.status === 401) {
          return {
            content: [
              {
                type: 'text',
                text: 'Authentication failed for AppSignal API',
              }
            ],
            isError: true,
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: error.message || 'Error fetching AppSignal sample',
            }
          ],
          isError: true,
        };
      }
    }
  );

  // Add 'search_samples' tool
  server.tool(
    'search_samples',
    'Search for samples in an AppSignal application (errors, performance, or all)',
    {
      appId: z.string().describe('The AppSignal application ID'),
      sample_type: z.enum(['all', 'errors', 'performance']).optional().default('errors').describe('Type of samples to search (all, errors, performance)'),
      exception: z.string().optional().describe('Filter by exception name (e.g., NoMethodError) - only for error samples'),
      action_id: z.string().optional().describe('Filter by action name (e.g., BlogPostsController-hash-show)'),
      since: z.union([z.string(), z.number()]).optional().describe('Start timestamp in UTC (timestamp or ISO format)'),
      before: z.union([z.string(), z.number()]).optional().describe('End timestamp in UTC (timestamp or ISO format)'),
      limit: z.number().optional().describe('Maximum number of samples to return (defaults to 10)'),
      count_only: z.boolean().optional().describe('Only return the count, not the samples'),
    },
    async (params) => {
      const { appId, sample_type, exception, action_id, since, before, limit, count_only } = params;
      const filters = { exception, action_id, since, before, limit, count_only };
      const sampleType = sample_type as SampleType;
      
      logger.info(`Searching AppSignal ${sampleType} samples in app ${appId} with filters:`, filters);
      
      try {
        const result = await searchSamples(filters, appId, sampleType);
        
        const formattedResult = {
          count: result.count,
          sample_type: sampleType,
          samples: result.log_entries.map(entry => ({
            id: entry.id,
            action: entry.action,
            path: entry.path,
            duration: entry.duration,
            status: entry.status,
            time: entry.time,
            is_exception: entry.is_exception,
            exception: entry.exception.name
          }))
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedResult, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Error searching AppSignal ${sampleType} samples:`, error);
        
        // Handle different error cases
        if (error.status === 401) {
          return {
            content: [
              {
                type: 'text',
                text: 'Authentication failed for AppSignal API',
              }
            ],
            isError: true,
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: error.message || `Error searching AppSignal ${sampleType} samples`,
            }
          ],
          isError: true,
        };
      }
    }
  );

  // Start the server with stdio transport
  logger.info('Starting MCP server with stdio transport');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // The server is now running and will handle messages from stdin and output responses to stdout
  logger.info('MCP server running with stdio transport');
  
  return server;
}
