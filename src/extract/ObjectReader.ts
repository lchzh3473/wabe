/* eslint-disable @typescript-eslint/naming-convention */
import ClassIDType from './ClassIDType';
import BinaryReader from '../BinaryReader';
import type UnityFileReader from './UnityReader';
import type { SerializedType } from './SerializedType';
import type ObjectInfo from './ObjectInfo';
import type SerializedFile from './SerializedFile';
import type BuildTarget from './BuildTarget';
import type SerializedFileFormatVersion from './SerializedFileFormatVersion';
import type BuildType from './BuildType';
export class ObjectReader extends BinaryReader {
  public assetFile: SerializedFile;
  public m_PathID: bigint;
  public byteStart: long;
  public byteSize: uint;
  public type: ClassIDType;
  public serializedType: SerializedType;
  public platform: BuildTarget;
  public m_Version: SerializedFileFormatVersion;
  public constructor(reader: UnityFileReader, assetFile: SerializedFile, objectInfo: ObjectInfo) {
    super(reader.buffer, reader.endian);
    this.assetFile = assetFile;
    this.m_PathID = objectInfo.m_PathID;
    this.byteStart = objectInfo.byteStart;
    this.byteSize = objectInfo.byteSize;
    if (ClassIDType[objectInfo.classID] === undefined) {
      this.type = ClassIDType.UnknownType;
    } else {
      this.type = objectInfo.classID;
    }
    this.serializedType = objectInfo.serializedType;
    this.platform = assetFile.m_TargetPlatform;
    this.m_Version = assetFile.header.m_Version;
  }
  public get version(): int[] {
    return this.assetFile.version;
  }
  public get buildType(): BuildType {
    return this.assetFile.buildType;
  }
  public reset(): void {
    this.position = this.byteStart;
  }
}
