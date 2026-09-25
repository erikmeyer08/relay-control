import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

function digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function matches(candidate: string, expected: string): boolean {
  const a = digest(candidate);
  const b = digest(expected);
  return crypto.timingSafeEqual(a, b);
}

export function apiKeyAuth(apiKeys: string[]): RequestHandler {
  return (req, res, next) => {
    const supplied = req.header('x-api-key');

    if (!supplied) {
      res.status(401).json({ error: 'authentication_required' });
      return;
    }

    if (!apiKeys.some((key) => matches(supplied, key))) {
      res.status(403).json({ error: 'invalid_credentials' });
      return;
    }

    next();
  };
}
