# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AppSignal MCP is a Model Context Protocol (MCP) server for interacting with AppSignal's error monitoring API, built with Bun, TypeScript, and the official MCP TypeScript SDK. It creates a bridge that allows Claude to directly query AppSignal error data.

## Common Commands

### Development

- **Start the server**: `bun start`
- **Start with auto-reload**: `bun dev`
- **Run tests**: `bun test`
- **Build executable**: `bun run build`

### CLI Options

The server can be configured using command line arguments:

```
appsignal-mcp --appsignal-api-token your-token
```

Available options:
- `--appsignal-api-token <token>` - AppSignal API token
- `--log-level <level>` - Logging level (debug, info, warn, error)
- `--port <port>` - Server port number

## Code Architecture

### Core Components

1. **MCP Server (`src/mcp/server.ts`)**
   - Creates an MCP-compliant server using the official SDK
   - Registers two tools: `get_error_sample` and `search_error_samples`
   - Uses stdio transport for communication with Claude

2. **AppSignal Integration**
   - `src/appsignal/client.ts` - Core API client for fetching error samples
   - `src/appsignal/auth.ts` - Handles authentication with AppSignal's API
   - `src/appsignal/types.ts` - TypeScript type definitions for AppSignal data structures

3. **Configuration & Utilities**
   - `src/utils/config.ts` - Handles configuration from CLI args and env variables
   - `src/utils/logger.ts` - Provides logging capabilities with configurable levels

4. **Main Entry Point**
   - `src/index.ts` - CLI interface and application bootstrapping

### Data Flow

1. User runs the MCP server with AppSignal credentials
2. MCP server initializes and listens on stdio for commands
3. When Claude requests error data, it sends a request to the MCP server
4. The server authenticates with AppSignal and fetches the requested data
5. The formatted error data is returned to Claude through the MCP protocol

## MCP Tools

### 1. get_error_sample

Gets details about a specific error by ID.

**Parameters:**
- `sampleId` (string, required): The AppSignal sample ID (e.g., "51f29e7b183d700800150358_ErrorController-hash-trigger_1475761080")
- `appId` (string, required): The AppSignal application ID

**Returns:**
Detailed information about the error including exception details, request information, and metadata.

### 2. search_error_samples

Searches for errors in an application with optional filters.

**Parameters:**
- `appId` (string, required): The AppSignal application ID
- `exception` (string, optional): Filter by exception name (e.g., "NoMethodError")
- `action_id` (string, optional): Filter by action name (e.g., "BlogPostsController-hash-show")
- `since` (string/number, optional): Start timestamp in UTC (timestamp or ISO format)
- `before` (string/number, optional): End timestamp in UTC (timestamp or ISO format)
- `limit` (number, optional): Maximum number of samples to return (defaults to 10)
- `count_only` (boolean, optional): Only return the count, not the samples

**Returns:**
List of error samples matching the criteria with count information.

## Environment Setup

The application requires a `.env` file with the following variables:

```
# Server configuration
PORT=3000
LOG_LEVEL=info

# AppSignal configuration
APPSIGNAL_API_TOKEN=your-api-token
```

## Claude Code Integration

To use this MCP server with Claude Code, configure a `.mcp.json` file:

```json
{
  "mcpServers": {
    "appsignal-mcp": {
      "type": "stdio",
      "command": "bun",
      "args": [
        "run",
        "start"
      ],
      "env": {
        "APPSIGNAL_API_TOKEN": "your-api-token"
      }
    }
  }
}
```