export interface Config {
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  appsignal: {
    apiToken: string;
  };
}

export interface CliOptions {
  appsignalApiToken?: string;
  logLevel?: Config['logLevel'];
  port?: number;
}

export function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--appsignal-api-token' && i + 1 < args.length) {
      options.appsignalApiToken = args[++i];
    } else if (arg === '--log-level' && i + 1 < args.length) {
      const level = args[++i];
      if (['debug', 'info', 'warn', 'error'].includes(level)) {
        options.logLevel = level as Config['logLevel'];
      }
    } else if (arg === '--port' && i + 1 < args.length) {
      options.port = parseInt(args[++i], 10);
    }
  }

  return options;
}

export function loadConfig(): Config {
  const cliOptions = parseCliOptions();
  
  return {
    port: cliOptions.port || parseInt(process.env.PORT || '3000', 10),
    logLevel: cliOptions.logLevel || (process.env.LOG_LEVEL || 'info') as Config['logLevel'],
    appsignal: {
      apiToken: cliOptions.appsignalApiToken || process.env.APPSIGNAL_API_TOKEN || '',
    }
  };
}