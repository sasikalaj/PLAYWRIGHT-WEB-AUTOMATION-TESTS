type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const ANSI: Record<LogLevel | 'reset' | 'dim', string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

// Resolve once at module load so its consistent across all logger instances
const MIN_LEVEL: LogLevel = (() => {
  const env = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return env in LEVEL_PRIORITY ? env : 'info';
})();

// Only apply ANSI colors in a real terminal and not in CI logs
const USE_COLOR: boolean = process.stdout.isTTY ?? false;

function colorize(color: string, text: string): string {
  return USE_COLOR ? `${color}${text}${ANSI.reset}` : text;
}

export const createLogger = (context: string) => {
  const shouldLog = (level: LogLevel): boolean =>
    LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];

  const buildPrefix = (level: LogLevel): string => {
    const timestamp = new Date().toISOString();
    const levelTag = `[${level.toUpperCase().padEnd(5)}]`;
    const contextTag = `[${context}]`;
    return USE_COLOR
      ? `${colorize(ANSI.dim, timestamp)} ${colorize(ANSI[level], levelTag)} ${colorize(ANSI.dim, contextTag)}`
      : `${timestamp} ${levelTag} ${contextTag}`;
  };

  const serialize = (data: unknown): string => {
    if (data === undefined) return '';
    try {
      return ' ' + JSON.stringify(data, null, 0);
    } catch {
      return ' ' + String(data);
    }
  };

  const debug = (message: string, data?: unknown): void => {
    if (shouldLog('debug')) {
      console.debug(`${buildPrefix('debug')} ${message}${serialize(data)}`);
    }
  };

  const info = (message: string, data?: unknown): void => {
    if (shouldLog('info')) {
      console.info(`${buildPrefix('info')} ${message}${serialize(data)}`);
    }
  };

  const warn = (message: string, data?: unknown): void => {
    if (shouldLog('warn')) {
      console.warn(`${buildPrefix('warn')} ${message}${serialize(data)}`);
    }
  };

  const error = (message: string, err?: unknown): void => {
    if (shouldLog('error')) {
      const detail =
        err instanceof Error
          ? `\n  ${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ''}`
          : err !== undefined
            ? `\n  ${String(err)}`
            : '';
      console.error(`${buildPrefix('error')} ${message}${detail}`);
    }
  };

  const step = (message: string): void => {
    info(`→ ${message}`);
  };

  return { debug, info, warn, error, step };
};
