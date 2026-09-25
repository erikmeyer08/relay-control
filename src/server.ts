import fs from 'node:fs';
import path from 'node:path';
import { loadConfiguration } from './config';
import { createLogger } from './logger';
import { MemoryGpioDriver } from './gpio/memory-driver';
import { OnoffGpioDriver } from './gpio/onoff-driver';
import { RelayService } from './relay/service';
import { createApp } from './http/app';

function readVersion(): string {
  try {
    const packagePath = path.resolve(__dirname, '..', 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8')).version ?? 'unknown';
  } catch {
    return process.env.RELAY_CONTROL_VERSION ?? 'unknown';
  }
}

async function main() {
  const configuration = loadConfiguration();
  const logger = createLogger(configuration.env.LOG_LEVEL);

  const useMock = process.env.GPIO_DRIVER === 'memory';
  const driver = useMock ? new MemoryGpioDriver() : new OnoffGpioDriver();

  const relayService = new RelayService(
    configuration.file.relays,
    driver,
    logger
  );

  relayService.initializeSafeState();

  const app = createApp({
    logger,
    apiKeys: configuration.apiKeys,
    config: configuration.file,
    relayService,
    version: readVersion()
  });

  const server = app.listen(
    configuration.env.PORT,
    configuration.env.BIND_ADDRESS,
    () => {
      logger.info(
        {
          address: configuration.env.BIND_ADDRESS,
          port: configuration.env.PORT,
          controllerId: configuration.file.controller.id,
          gpioDriver: useMock ? 'memory' : 'onoff'
        },
        'relay-control started'
      );
    }
  );

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutdown requested');

    server.close(() => {
      relayService.close();
      logger.info('relay-control stopped');
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  process.stderr.write(`Failed to start relay-control: ${String(error)}\n`);
  process.exit(1);
});
