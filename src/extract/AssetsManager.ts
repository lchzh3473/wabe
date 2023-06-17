import UnityFileReader from './UnityReader';
import BundleFile from './BundleFile';
import SerializedFile from './SerializedFile';
import { ObjectReader } from './ObjectReader';
import UnityObject, { AssetBundle } from './UnityObject';
import { Texture2D } from './classes/Texture2D';
import { TextAsset } from './classes/TextAsset';
import { FileType } from './type/FileType';
import ClassIDType from './ClassIDType';
import { AudioClip } from './classes/AudioClip';
import SerializedFileFormatVersion from './SerializedFileFormatVersion';
export default class AssetsManager {
  public assetsFileList: SerializedFile[];
  public assetFileHashes: string[];
  public resourceFileReaders: Record<string, UnityFileReader>;
  public assetsFileIndexCache: Record<string, int>;
  public constructor() {
    this.assetsFileList = [];
    this.assetFileHashes = [];
    this.resourceFileReaders = {};
    this.assetsFileIndexCache = {};
  }
  public loadFile(file: Uint8Array | UnityFileReader, originalPath = ''): void {
    const file1 = file instanceof UnityFileReader ? file : new UnityFileReader(originalPath, file);
    if (file1.fileType === FileType.BundleFile) this.loadBundle(file1);
  }
  public loadBundle(reader: UnityFileReader, originalPath = ''): void {
    const bundleFile = new BundleFile(reader);
    for (const file of bundleFile.fileList) {
      const subreader = new UnityFileReader(`${/* path.dirname */reader.fullPath}/${file.path!}`, file.stream!);
      console.log(subreader.fullPath, subreader.fileType);
      if (subreader.fileType === FileType.AssetsFile) {
        this.loadAssets(subreader, originalPath || reader.fullPath, bundleFile.m_Header.unityRevision);
      } else {
        this.resourceFileReaders[/* path.basename */file.path!] = subreader;
      }
    }
  }
  public loadAssets(reader: UnityFileReader, originalPath = '', unityVersion = ''): void {
    if (!this.assetFileHashes.includes(/* path.basename */reader.fullPath)) {
      const assetFile = new SerializedFile(reader, this);
      assetFile.originalPath = originalPath;
      if (!unityVersion && assetFile.header.m_Version < SerializedFileFormatVersion.Unknown_7) {
        assetFile.setVersion(unityVersion);
      }
      this.assetsFileList.push(assetFile);
      this.assetFileHashes.push(/* path.basename */assetFile.fileName);
    }
  }
  public readAssets(): void {
    for (const assetFile of this.assetsFileList) {
      for (const objectInfo of assetFile.m_Objects) {
        const objectReader = new ObjectReader(assetFile.reader, assetFile, objectInfo);
        const obj = getObject(objectReader);
        /* if (obj) */ assetFile.addObject(obj);
      }
    }
  }
}
/** @param {ObjectReader} objectReader */
function getObject(objectReader: ObjectReader) {
  switch (objectReader.type) {
    case ClassIDType.AssetBundle:
      return new AssetBundle(objectReader);
    case ClassIDType.TextAsset:
      return new TextAsset(objectReader);
    // case ClassID.SPRITE:
    //   return;
    case ClassIDType.Texture2D:
      return new Texture2D(objectReader);
    case ClassIDType.AudioClip:
      return new AudioClip(objectReader);
    // case ClassID.MONO_SCRIPT:
    //   return;
    // case ClassID.MONO_BEHAVIOUR:
    //   return;
    // case ClassID.TRANSFORM:
    //   return;
    // case ClassID.GAME_OBJECT:
    //   return;
    // case ClassID.CANVAS:
    //   return;
    // case ClassID.CANVAS_RENDERER:
    //   return;
    // case ClassID.RECT_TRANSFORM:
    //   return;
    // case ClassID.ANIMATION_CLIP:
    //   return;
    // case ClassID.MATERIAL:
    //   return;
    // case ClassID.ANIMATOR_CONTROLLER:
    //   return;
    // case ClassID.ANIMATOR:
    //   return;
    // case ClassID.SPRITE_RENDERER:
    //   return;
    // case ClassID.SHADER:
    //   return;
    // case ClassID.FONT:
    //   return new Font(objectReader);
    default: {
      const className = ClassIDType[objectReader.type] || `Unknown${objectReader.type}`;
      console.log(`Class UnityEngine.${className} not implemented`);
      return new UnityObject(objectReader);
    }
  }
}
