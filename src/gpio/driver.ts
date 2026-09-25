import type { RelayState } from '../types';

export interface GpioChannel {
  read(): RelayState;
  write(state: RelayState): void;
  close(): void;
}

export interface GpioDriver {
  open(gpio: number, activeLow: boolean, initialState: RelayState): GpioChannel;
}
