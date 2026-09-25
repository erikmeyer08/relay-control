declare module 'onoff' {
  export class Gpio {
    constructor(
      gpio: number,
      direction: 'in' | 'out' | 'high' | 'low',
      edge?: 'none' | 'rising' | 'falling' | 'both',
      options?: {
        activeLow?: boolean;
        reconfigureDirection?: boolean;
        debounceTimeout?: number;
      }
    );
    readSync(): 0 | 1;
    writeSync(value: 0 | 1): void;
    unexport(): void;
  }
}
