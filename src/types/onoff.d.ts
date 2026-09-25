declare module 'onoff' {
  export class Gpio {
    constructor(gpio: number, direction: 'in' | 'out');
    readSync(): 0 | 1;
    writeSync(value: 0 | 1): void;
    unexport(): void;
  }
}
