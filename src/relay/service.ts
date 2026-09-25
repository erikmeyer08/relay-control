import type { Logger } from 'pino';
import type { RelayDefinition } from '../config';
import type { GpioChannel, GpioDriver } from '../gpio/driver';
import type { RelaySnapshot, RelayState } from '../types';

interface ManagedRelay {
  definition: RelayDefinition;
  channel: GpioChannel;
}

export class RelayService {
  private readonly relays = new Map<string, ManagedRelay>();

  constructor(
    definitions: RelayDefinition[],
    driver: GpioDriver,
    private readonly logger: Logger
  ) {
    for (const definition of definitions) {
      const channel = driver.open(definition.gpio, definition.activeLow, definition.startupState);
      this.relays.set(definition.id, { definition, channel });
    }
  }

  initializeSafeState(): void {
    for (const relay of this.relays.values()) {
      if (!relay.definition.enabled) continue;

      relay.channel.write(relay.definition.startupState);
      this.logger.info(
        {
          relayId: relay.definition.id,
          gpio: relay.definition.gpio,
          state: relay.definition.startupState
        },
        'relay initialized to startup state'
      );
    }
  }

  list(): RelaySnapshot[] {
    return [...this.relays.values()].map((relay) => this.snapshot(relay));
  }

  get(id: string): RelaySnapshot {
    const relay = this.requireRelay(id);
    return this.snapshot(relay);
  }

  setState(id: string, state: RelayState): RelaySnapshot {
    const relay = this.requireRelay(id);

    if (!relay.definition.enabled) {
      throw new RelayDisabledError(id);
    }

    if (state === 'on' && relay.definition.interlockGroup) {
      for (const [otherId, otherRelay] of this.relays.entries()) {
        if (
          otherId !== id &&
          otherRelay.definition.enabled &&
          otherRelay.definition.interlockGroup === relay.definition.interlockGroup
        ) {
          otherRelay.channel.write('off');
          this.logger.info(
            {
              relayId: otherId,
              gpio: otherRelay.definition.gpio,
              interlockGroup: relay.definition.interlockGroup
            },
            'relay switched off by interlock'
          );
        }
      }
    }

    relay.channel.write(state);

    const snapshot = this.snapshot(relay);
    this.logger.info(
      { relayId: id, gpio: relay.definition.gpio, state },
      'relay state changed'
    );

    return snapshot;
  }

  allOff(): RelaySnapshot[] {
    for (const relay of this.relays.values()) {
      if (relay.definition.enabled) relay.channel.write('off');
    }

    this.logger.warn('all enabled relays set to off');
    return this.list();
  }

  close(): void {
    for (const relay of this.relays.values()) {
      relay.channel.close();
    }
  }

  private snapshot(relay: ManagedRelay): RelaySnapshot {
    return {
      id: relay.definition.id,
      name: relay.definition.name,
      gpio: relay.definition.gpio,
      enabled: relay.definition.enabled,
      state: relay.channel.read()
    };
  }

  private requireRelay(id: string): ManagedRelay {
    const relay = this.relays.get(id);
    if (!relay) throw new RelayNotFoundError(id);
    return relay;
  }
}

export class RelayNotFoundError extends Error {
  constructor(id: string) {
    super(`Relay '${id}' was not found`);
    this.name = 'RelayNotFoundError';
  }
}

export class RelayDisabledError extends Error {
  constructor(id: string) {
    super(`Relay '${id}' is disabled`);
    this.name = 'RelayDisabledError';
  }
}
