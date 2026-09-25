import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { MemoryGpioDriver } from '../src/gpio/memory-driver';
import {
  RelayDisabledError,
  RelayNotFoundError,
  RelayService
} from '../src/relay/service';

const logger = pino({ enabled: false });

describe('RelayService', () => {
  it('initializes configured startup states and changes relay state', () => {
    const service = new RelayService([
      {
        id: 'pump',
        name: 'Pump',
        gpio: 22,
        activeLow: false,
        startupState: 'off',
        enabled: true
      }
    ], new MemoryGpioDriver(), logger);

    service.initializeSafeState();
    expect(service.get('pump').state).toBe('off');

    expect(service.setState('pump', 'on').state).toBe('on');
    expect(service.get('pump').state).toBe('on');
  });

  it('rejects unknown and disabled relays', () => {
    const service = new RelayService([
      {
        id: 'disabled',
        name: 'Disabled',
        gpio: 16,
        activeLow: false,
        startupState: 'off',
        enabled: false
      }
    ], new MemoryGpioDriver(), logger);

    expect(() => service.get('missing')).toThrow(RelayNotFoundError);
    expect(() => service.setState('disabled', 'on')).toThrow(RelayDisabledError);
  });
});
