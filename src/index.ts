#!/usr/bin/env bun

import { startServer } from './mcp/server';
import { configureLogger } from './utils/logger';
import { loadConfig } from './utils/config';

// Show help message if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AppSignal MCP - CLI Tool for interacting with AppSignal error monitoring

Usage:
  appsignal-mcp [options]

Options:
  --appsignal-api-token <token>  AppSignal API token
  --log-level <level>            Logging level (debug, info, warn, error)
  --port <port>                  Server port number
  --help, -h                     Show this help message

Environment variables can also be used instead of CLI options:
  APPSIGNAL_API_TOKEN            AppSignal API token
  LOG_LEVEL                      Logging level
  PORT                           Server port number
  `);
  process.exit(0);
}

// Initialize application
async function main() {
  // Load configuration
  const config = loadConfig();
  
  // Set up logger
  configureLogger(config.logLevel);
  
  // Start MCP server with stdio transport
  await startServer(config);
}

main().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});