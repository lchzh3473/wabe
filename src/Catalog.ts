import BinaryReader from './BinaryReader';
import EndianType from './extract/EndianType';
interface Entry {
  internalId: number;
  provider: number;
  dependencyKey: unknown;
  depHash: number;
  primaryKey: unknown;
  resourceType: string;
  data: unknown;
  keys: unknown[];
}
export class Catalog {
  public buckets: { offset: number; entries: number[] }[];
  public keys: unknown[];
  public entries: Entry[];
  public fnameMap: Map<unknown, unknown>;
  public constructor(file: string) {
    const data = JSON.parse(file) as CatalogData;
    // bucket
    this.buckets = [];
    const btr = new BinaryReader(Buffer.from(data.m_BucketDataString, 'base64'), EndianType.LittleEndian);
    const bucketCount = btr.readUint32();
    for (let i = 0; i < bucketCount; i++) {
      const offset = btr.readInt32();
      const entries = [];
      const entryCount = btr.readInt32();
      for (let j = 0; j < entryCount; j++) entries.push(btr.readInt32());
      this.buckets.push({ offset, entries });
    }
    // key
    this.keys = [];
    const kdr = new BinaryReader(Buffer.from(data.m_KeyDataString, 'base64'), EndianType.LittleEndian);
    const keyCount = kdr.readUint32();
    for (let i = 0; i < keyCount; i++) this.keys.push(readObject(kdr));
    // entry
    const eds = new BinaryReader(Buffer.from(data.m_EntryDataString, 'base64'), EndianType.LittleEndian);
    const xds = new BinaryReader(Buffer.from(data.m_ExtraDataString, 'base64'), EndianType.LittleEndian);
    const entryCount = eds.readUint32();
    this.entries = [];
    for (let i = 0; i < entryCount; i++) {
      const internalId = eds.readInt32();
      const providerIndex = eds.readInt32();
      const dependencyKeyIndex = eds.readInt32();
      const depHash = eds.readInt32();
      const dataIndex = eds.readInt32();
      const primaryKey = eds.readInt32();
      const resourceType = eds.readInt32();
      let obj = null;
      if (dataIndex >= 0) {
        xds.position = dataIndex;
        obj = readObject(xds);
      }
      this.entries.push({
        internalId: data.m_InternalIds[internalId],
        provider: data.m_ProviderIds[providerIndex],
        dependencyKey: dependencyKeyIndex < 0 ? null : this.keys[dependencyKeyIndex],
        depHash,
        primaryKey: this.keys[primaryKey],
        resourceType: data.m_resourceTypes[resourceType],
        data: obj,
        keys: []
      });
    }
    for (let i = 0; i < bucketCount; i++) {
      for (const j of this.buckets[i].entries) this.entries[j].keys.push(this.keys[i]);
    }
    this.fnameMap = new Map();
    for (const e of this.entries) this.fnameMap.set(e.dependencyKey, e.primaryKey);
  }
}
function readObject(reader: BinaryReader) {
  const type = reader.readByte();
  switch (type) {
    case 0: // ascii string
      return reader.readString(reader.readUint32());
    case 1: // unicode(16) string
      return reader.readString(reader.readUint32(), 'utf16le');
    case 2: // u16
      return reader.readUint16();
    case 3: // u32
      return reader.readUint32();
    case 4: // i32
      return reader.readInt32();
    case 7: { // json object
      const assemblyName = reader.readString(reader.readByte());
      const className = reader.readString(reader.readByte());
      const json = JSON.parse(reader.readString(reader.readInt32(), 'utf16le')) as Record<string, unknown>;
      return { assemblyName, className, json };
    }
    default:
      throw new RangeError(`Type ${type} is not supported now.`);
  }
}
