export enum Frequency {
  MONTHLY = 'monthly',
  TERM = 'term',
  ONCE = 'once',
  ANNUAL = 'annual',
}

export const FrequencyLabels = {
  [Frequency.MONTHLY]: 'Mensual',
  [Frequency.TERM]: 'Ciclo',
  [Frequency.ONCE]: 'Una vez',
  [Frequency.ANNUAL]: 'Anual',
};
