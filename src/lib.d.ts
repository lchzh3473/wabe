/* eslint-disable @typescript-eslint/naming-convention */
// Custom
interface Window {
  _i: [string, (number | string)[], number, number];
  lz4api?: {
    getLinearMemoryOffset: () => number;
    memory: WebAssembly.Memory;
    lz4BlockDecode: (inputOffset: number, inputSize: number, outputOffset: number) => number;
  };
  // hook: object;
  // oggmented: Oggmented;
}
interface CatalogData {
  m_BucketDataString: string;
  m_KeyDataString: string;
  m_EntryDataString: string;
  m_ExtraDataString: string;
  m_InternalIds: number[];
  m_ProviderIds: number[];
  m_resourceTypes: string[];
}
type byte = number;
type byteArray = Uint8Array;
type short = number;
type ushort = number;
type int = number;
type uint = number;
type float = number;
type long = number;
type ulong = number;
type bool = boolean;
type Stream = Uint8Array;
declare const Utils: {
  escapeHTML: (str: string) => string;
  addFont: (name: string, alt?: FontOptions) => Promise<unknown>;
  randomUUID: () => string;
} = {};
