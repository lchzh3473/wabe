/* eslint-disable @typescript-eslint/naming-convention */
import { PPtr } from './classes/PPtr';
import type { ObjectReader } from './ObjectReader';
import BuildTarget from './BuildTarget';
import type SerializedFile from './SerializedFile';
import type BuildType from './BuildType';
import type { SerializedType } from './SerializedType';
export default class UnityObject {
  public assetsFile: SerializedFile;
  public reader: ObjectReader;
  public m_PathID: bigint;
  public version: number[];
  public buildType: BuildType;
  public platform: BuildTarget;
  public type: number;
  public serializedType: SerializedType;
  public byteSize: uint;
  public constructor(reader: ObjectReader) {
    this.reader = reader;
    reader.reset();
    this.assetsFile = reader.assetFile;
    this.type = reader.type;
    this.m_PathID = reader.m_PathID;
    this.version = reader.version;
    this.buildType = reader.buildType;
    this.platform = reader.platform;
    this.serializedType = reader.serializedType;
    this.byteSize = reader.byteSize;
    if (this.platform === BuildTarget.NoTarget) {
      /* const m_ObjectHideFlags = */ reader.readUint32();
    }
  }
}
class EditorExtension extends UnityObject {
  public constructor(reader: ObjectReader) {
    super(reader);
    if (this.platform === BuildTarget.NoTarget) {
      // @ts-expect-error: private
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _prefabParentObject = new PPtr(reader);
      // @ts-expect-error: private
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _prefabInternal = new PPtr(reader);
    }
  }
}
export class NamedObject extends EditorExtension {
  public name: string;
  public constructor(reader: ObjectReader) {
    super(reader);
    this.name = reader.readAlignedString();
  }
}
class AssetInfo {
  public preloadIndex: number;
  public preloadSize: number;
  public asset: PPtr<UnityObject>;
  public constructor(reader: ObjectReader) {
    this.preloadIndex = reader.readInt32();
    this.preloadSize = reader.readInt32();
    this.asset = new PPtr(reader);
  }
}
export class AssetBundle extends NamedObject {
  public preloadTable: PPtr<UnityObject>[];
  public container: Record<string, AssetInfo>;
  public constructor(reader: ObjectReader) {
    super(reader);
    this.preloadTable = [];
    const preloadTableSize = reader.readInt32();
    for (let i = 0; i < preloadTableSize; i++) {
      this.preloadTable.push(new PPtr(reader));
    }
    this.container = {};
    const containerSize = reader.readInt32();
    for (let i = 0; i < containerSize; i++) {
      const key = reader.readAlignedString();
      this.container[key] = new AssetInfo(reader);
    }
  }
}
