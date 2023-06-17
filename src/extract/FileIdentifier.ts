export default class FileIdentifier {
  public guid!: Uint8Array;
  public type!: int; // enum { kNonAssetType = 0, kDeprecatedCachedAssetType = 1, kSerializedAssetType = 2, kMetaAssetType = 3 };
  public pathName!: string;
  // custom
  public fileName!: string;
}
