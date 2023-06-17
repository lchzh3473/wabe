// Custom
interface Window {
  _i: [string, (number | string)[], number, number];
  hook: object;
  oggmented: Oggmented;
}
declare const Utils: {
  escapeHTML: (str: string) => string;
  addFont: (name: string, alt?: FontOptions) => Promise<unknown>;
  randomUUID: () => string;
} = {};
