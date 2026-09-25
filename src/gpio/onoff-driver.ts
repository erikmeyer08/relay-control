import { Gpio } from 'onoff';
import type { GpioChannel, GpioDriver } from './driver';
import type { RelayState } from '../types';

class OnoffChannel implements GpioChannel {
  constructor(
    private readonly gpio: Gpio,
    private readonly activeLow: boolean
  ) {}

  read(): RelayState {
    const physical = this.gpio.readSync();
    const logicalOn = this.activeLow ? physical === 0 : physical === 1;
    return logicalOn ? 'on' : 'off';
  }

  write(state: RelayState): void {
    const logicalOn = state === 'on';
    const physical = this.activeLow
      ? (logicalOn ? 0 : 1)
      : (logicalOn ? 1 : 0);

    this.gpio.writeSync(physical);
  }

  close(): void {
    this.gpio.unexport();
  }
}

export class OnoffGpioDriver implements GpioDriver {
  open(gpio: number, activeLow: boolean): GpioChannel {
    return new OnoffChannel(new Gpio(gpio, 'out'), activeLow);
  }
}
