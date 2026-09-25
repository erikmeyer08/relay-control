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
  it('turns off peers in the same interlock group before activating a relay', () => {
    const service = new RelayService([
      {
        id: 'speed-1',
        name: 'Speed 1',
        gpio: 27,
        activeLow: true,
        startupState: 'off',
        enabled: true,
        interlockGroup: 'pump-speed'
      },
      {
        id: 'speed-2',
        name: 'Speed 2',
        gpio: 22,
        activeLow: true,
        startupState: 'off',
        enabled: true,
        interlockGroup: 'pump-speed'
      }
    ], new MemoryGpioDriver(), logger);

    service.initializeSafeState();
    service.setState('speed-1', 'on');
    expect(service.get('speed-1').state).toBe('on');

    service.setState('speed-2', 'on');
    expect(service.get('speed-1').state).toBe('off');
    expect(service.get('speed-2').state).toBe('on');
  });
});
