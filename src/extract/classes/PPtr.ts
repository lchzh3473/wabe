/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import type { default as SerializedFile } from '../SerializedFile';
import type UnityObject from '../UnityObject';
import type { ObjectReader } from '../ObjectReader';
import SerializedFileFormatVersion from '../SerializedFileFormatVersion';
export class PPtr<T extends UnityObject> {
  public m_FileID: int;
  public m_PathID: bigint;
  public assetFile: SerializedFile;
  public index: int = -2; // -2 - Prepare, -1 - Missing
  public constructor(reader: ObjectReader) {
    this.m_FileID = reader.readInt32();
    this.m_PathID = reader.m_Version < SerializedFileFormatVersion.Unknown_14 ? BigInt(reader.readInt32()) : reader.readInt64();
    this.assetFile = reader.assetFile;
    this.index = -2;
  }
  public getAssetFile(): SerializedFile | null {
    if (this.m_FileID === 0) return this.assetFile;
    if (this.m_FileID > 0 && this.m_FileID - 1 < this.assetFile.m_Externals.length) {
      const { assetsFileList, assetsFileIndexCache } = this.assetFile.assetsManager;
      if (this.index === -2) {
        const m_External = this.assetFile.m_Externals[this.m_FileID - 1];
        const name = m_External.fileName;
        if (!(name in assetsFileIndexCache)) {
          const index = assetsFileList.indexOf(assetsFileList.find(x => x.fileName.toUpperCase() === name.toUpperCase())!);
          assetsFileIndexCache[name] = index;
        }
      }
      if (this.index >= 0) return assetsFileList[this.index];
    }
    return null;
  }
  public deref(): T | undefined {
    const sourceFile = this.getAssetFile();
    if (sourceFile && this.m_PathID.toString() in sourceFile.objectsDic) {
      return sourceFile.objectsDic[this.m_PathID.toString()] as T;
    }
    return undefined;
  }
}
