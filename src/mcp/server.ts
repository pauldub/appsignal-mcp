import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Config } from '../utils/config';
import { logger } from '../utils/logger';
import { fetchErrorSample, searchErrorSamples } from '../appsignal/client';
import { ErrorSample } from '../appsignal/types';

/**
 * Format an error sample for better readability
 */
function formatErrorSample(sample: ErrorSample) {
  const formattedSample = {
    id: sample.id,
    action: sample.action,
    path: sample.path,
    status: sample.status,
    duration: sample.duration,
    hostname: sample.hostname,
    time: sample.time,
    environment: sample.environment || {},
    params: sample.params || {},
    session_data: sample.session_data || {},
    tags: sample.tags || {},
    exception: sample.exception ? {
      message: sample.exception.message,
      name: sample.exception.name,
      backtrace: sample.exception.backtrace || []
    } : null
  };

  return formattedSample;
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

  // Add 'get_error_sample' tool
  server.tool(
    'get_error_sample',
    'Get details about a specific AppSignal error sample by ID',
    {
      sampleId: z.string().describe('The AppSignal error sample ID'),
      appId: z.string().describe('The AppSignal application ID'),
    },
    async ({ sampleId, appId }) => {
      logger.info(`Fetching AppSignal error sample: ${sampleId} from app: ${appId}`);
      
      try {
        const sample = await fetchErrorSample(sampleId, appId);
        const formattedSample = formatErrorSample(sample);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formattedSample, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Error fetching AppSignal error sample ${sampleId}:`, error);
        
        // Handle different error cases
        if (error.status === 404) {
          return {
            content: [
              {
                type: 'text',
                text: `Error sample ${sampleId} not found`,
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
              text: error.message || 'Error fetching AppSignal error sample',
            }
          ],
          isError: true,
        };
      }
    }
  );

  // Add 'search_error_samples' tool
  server.tool(
    'search_error_samples',
    'Search for error samples in an AppSignal application',
    {
      appId: z.string().describe('The AppSignal application ID'),
      exception: z.string().optional().describe('Filter by exception name (e.g., NoMethodError)'),
      action_id: z.string().optional().describe('Filter by action name (e.g., BlogPostsController-hash-show)'),
      since: z.union([z.string(), z.number()]).optional().describe('Start timestamp in UTC (timestamp or ISO format)'),
      before: z.union([z.string(), z.number()]).optional().describe('End timestamp in UTC (timestamp or ISO format)'),
      limit: z.number().optional().describe('Maximum number of samples to return (defaults to 10)'),
      count_only: z.boolean().optional().describe('Only return the count, not the samples'),
    },
    async (params) => {
      const { appId, exception, action_id, since, before, limit, count_only } = params;
      const filters = { exception, action_id, since, before, limit, count_only };
      
      logger.info(`Searching AppSignal error samples in app ${appId} with filters:`, filters);
      
      try {
        const result = await searchErrorSamples(filters, appId);
        
        const formattedResult = {
          count: result.count,
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
        logger.error(`Error searching AppSignal error samples:`, error);
        
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
              text: error.message || 'Error searching AppSignal error samples',
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