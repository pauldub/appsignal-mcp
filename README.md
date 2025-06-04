# AppSignal MCP

A Model Context Protocol (MCP) server for AppSignal error monitoring API integration. This server allows AI assistants to directly query and fetch error data from AppSignal through the MCP protocol.

## Features

- Fetch details about specific error samples
- Search error samples with flexible filters
- Integration with AppSignal's Error Monitoring API

## Prerequisites

- [Bun](https://bun.sh/) runtime
- AppSignal account and API token
- Application ID from your AppSignal dashboard

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/appsignal-mcp.git
cd appsignal-mcp

# Install dependencies
bun install
```

## Configuration

Create a `.env` file in the root directory with your AppSignal credentials:

```env
# Server configuration
PORT=3000
LOG_LEVEL=info

# AppSignal configuration
APPSIGNAL_API_TOKEN=your-api-token
```

## Usage

### Starting the Server

```bash
# Run the server
bun start

# Development mode with auto-reload
bun dev
```

### CLI Options

```bash
appsignal-mcp --appsignal-api-token your-token
```

Available options:
- `--appsignal-api-token <token>` - AppSignal API token
- `--log-level <level>` - Logging level (debug, info, warn, error)
- `--port <port>` - Server port number

## MCP Tools

### 1. get_error_sample

Gets details about a specific error by ID.

**Parameters:**
- `sampleId` (string, required): The AppSignal error sample ID
- `appId` (string, required): The AppSignal application ID

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

## Claude Integration

To use this MCP server with Claude, create a `.mcp.json` file in your Claude Code workspace:

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

## License

MIT