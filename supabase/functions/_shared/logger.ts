export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

const output = (level: LogLevel, message: string, correlationId: string, context?: Record<string, unknown>) => {
  const payload = {
    level,
    message,
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
    ...(context ?? {}),
  };

  const serialized = JSON.stringify(payload);

  if (level === 'ERROR') {
    console.error(serialized);
  } else if (level === 'WARN') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
};

export const createLogger = (correlationId: string): Logger => ({
  info: (message, context) => output('INFO', message, correlationId, context),
  warn: (message, context) => output('WARN', message, correlationId, context),
  error: (message, context) => output('ERROR', message, correlationId, context),
});

export const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error as Record<string, unknown>;
  }

  return { value: error };
};
