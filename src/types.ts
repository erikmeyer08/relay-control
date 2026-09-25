export type RelayState = 'on' | 'off';

export interface RelaySnapshot {
  id: string;
  name: string;
  gpio: number;
  enabled: boolean;
  state: RelayState;
}
