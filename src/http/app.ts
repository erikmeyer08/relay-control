import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { z } from 'zod';
import type { Logger } from 'pino';
import type { RelayControlFile } from '../config';
import { apiKeyAuth } from './auth';
import {
  RelayDisabledError,
  RelayNotFoundError,
  RelayService
} from '../relay/service';

const stateSchema = z.object({
  state: z.enum(['on', 'off'])
}).strict();

export function createApp(options: {
  logger: Logger;
  apiKeys: string[];
  config: RelayControlFile;
  relayService: RelayService;
  version: string;
}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '16kb' }));
  app.use(pinoHttp({ logger: options.logger }));

  app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/ready', (_req, res) => {
    res.json({
      status: 'ready',
      controllerId: options.config.controller.id
    });
  });

  const api = express.Router();
  api.use(apiKeyAuth(options.apiKeys));

  api.get('/capabilities', (_req, res) => {
    res.json({
      apiVersion: 'v1',
      features: {
        relayRead: true,
        relayWrite: true,
        allOff: true,
        interlocks: true,
        localScheduling: false,
        externalDatabase: false,
        releaseUpdates: true
      }
    });
  });

  api.get('/system', (_req, res) => {
    res.json({
      id: options.config.controller.id,
      name: options.config.controller.name,
      location: options.config.controller.location ?? null,
      version: options.version,
      platform: process.platform,
      architecture: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      relayCount: options.config.relays.length
    });
  });

  api.get('/relays', (_req, res) => {
    res.json({ relays: options.relayService.list() });
  });

  api.get('/relays/:id', (req, res, next) => {
    try {
      res.json(options.relayService.get(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  api.put('/relays/:id/state', (req, res, next) => {
    try {
      const body = stateSchema.parse(req.body);
      res.json(options.relayService.setState(req.params.id, body.state));
    } catch (error) {
      next(error);
    }
  });

  api.post('/relays/all/off', (_req, res) => {
    res.json({ relays: options.relayService.allOff() });
  });

  app.use('/api/v1', api);

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'invalid_request',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    if (error instanceof RelayNotFoundError) {
      res.status(404).json({ error: 'relay_not_found' });
      return;
    }

    if (error instanceof RelayDisabledError) {
      res.status(409).json({ error: 'relay_disabled' });
      return;
    }

    options.logger.error({ err: error }, 'unhandled request error');
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
