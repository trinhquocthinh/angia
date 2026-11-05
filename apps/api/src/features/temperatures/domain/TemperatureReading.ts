export interface NewTemperatureReading {
  readonly healthProfileId: string;
  readonly celsius: number;
  readonly measuredAt: Date;
  readonly recordedBy: string;
}

export type TemperatureReading = Omit<NewTemperatureReading, 'healthProfileId' | 'recordedBy'> & {
  readonly id: string;
  readonly recordedBy: string | null;
  readonly recordedAt: Date;
};
