import type { GpioChannel, GpioDriver } from './driver';
import type { RelayState } from '../types';

class MemoryChannel implements GpioChannel {
  constructor(private state: RelayState = 'off') {}

  read(): RelayState {
    return this.state;
  }

  write(state: RelayState): void {
    this.state = state;
  }

  close(): void {}
}

export class MemoryGpioDriver implements GpioDriver {
  private readonly channels = new Map<number, MemoryChannel>();

  open(gpio: number): GpioChannel {
    const existing = this.channels.get(gpio);
    if (existing) return existing;

    const channel = new MemoryChannel();
    this.channels.set(gpio, channel);
    return channel;
  }
}
