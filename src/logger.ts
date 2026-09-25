import pino from 'pino';

export function createLogger(level: string) {
  return pino({
    level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.x-api-key',
        'apiKey',
        'apiKeys',
        'RELAY_CONTROL_API_KEYS'
      ],
      censor: '[REDACTED]'
    }
  });
}
