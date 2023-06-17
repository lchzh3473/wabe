/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/* eslint-disable @typescript-eslint/naming-convention */
import type { ObjectReader } from '../ObjectReader';
import { ResourceReader } from '../ResourceReader';
import { Texture } from './Texture';
class StreamingInfo {
  public offset: long; // ulong
  public size: uint;
  public path: string;
  public constructor(reader: ObjectReader) {
    const { version } = reader;
    if (version[0] >= 2020) { // 2020.1 and up
      this.offset = reader.readInt64n();
    } else {
      this.offset = reader.readUint32();
    }
    this.size = reader.readUint32();
    this.path = reader.readAlignedString();
  }
}
class GLTextureSettings {
  public m_FilterMode: int;
  public m_Aniso: int;
  public m_MipBias: float;
  public m_WrapMode: int;
  public m_WrapV?: int;
  public m_WrapW?: int;
  public constructor(reader: ObjectReader) {
    const { version } = reader;
    this.m_FilterMode = reader.readInt32();
    this.m_Aniso = reader.readInt32();
    this.m_MipBias = reader.readSingle();
    if (version[0] >= 2017) { // 2017.x and up
      this.m_WrapMode = reader.readInt32(); // this.m_WrapU
      this.m_WrapV = reader.readInt32();
      this.m_WrapW = reader.readInt32();
    } else {
      this.m_WrapMode = reader.readInt32();
    }
  }
}
export class Texture2D extends Texture {
  public m_Width: int;
  public m_Height: int;
  public m_TextureFormat: TextureFormat;
  public m_MipMap?: bool;
  public m_MipCount?: int;
  public m_TextureSettings: GLTextureSettings;
  public imageData?: ResourceReader;
  public m_StreamData?: StreamingInfo;
  public constructor(reader: ObjectReader) {
    super(reader);
    const { version } = reader;
    this.m_Width = reader.readInt32();
    this.m_Height = reader.readInt32();
    /* const m_CompleteImageSize = */ reader.readInt32();
    if (version[0] >= 2020) { // 2020.1 and up
      /* const m_MipsStripped = */ reader.readInt32();
    }
    this.m_TextureFormat = reader.readInt32();
    if (version[0] < 5 || version[0] === 5 && version[1] < 2) { // 5.2 down
      this.m_MipMap = reader.readBoolean();
    } else {
      this.m_MipCount = reader.readInt32();
    }
    if (version[0] > 2 || version[0] === 2 && version[1] >= 6) { // 2.6.0 and up
      /* const m_IsReadable = */ reader.readBoolean();
    }
    if (version[0] >= 2020) { // 2020.1 and up
      /* const m_IsPreProcessed = */ reader.readBoolean();
    }
    if (version[0] > 2019 || version[0] === 2019 && version[1] >= 3) { // 2019.3 and up
      /* const m_IgnoreMasterTextureLimit = */ reader.readBoolean();
    }
    if (version[0] >= 3) { // 3.0.0 - 5.4
      if (version[0] < 5 || version[0] === 5 && version[1] <= 4) {
        /* const m_ReadAllowed = */ reader.readBoolean();
      }
    }
    if (version[0] > 2018 || version[0] === 2018 && version[1] >= 2) { // 2018.2 and up
      /* const m_StreamingMipmaps = */ reader.readBoolean();
    }
    reader.alignStream();
    if (version[0] > 2018 || version[0] === 2018 && version[1] >= 2) { // 2018.2 and up
      /* const m_StreamingMipmapsPriority = */ reader.readInt32();
    }
    /* const m_ImageCount = */ reader.readInt32();
    /* const m_TextureDimension = */ reader.readInt32();
    this.m_TextureSettings = new GLTextureSettings(reader);
    if (version[0] >= 3) { // 3.0 and up
      /* const m_LightmapFormat = */ reader.readInt32();
    }
    if (version[0] > 3 || version[0] === 3 && version[1] >= 5) { // 3.5.0 and up
      /* const m_ColorSpace = */ reader.readInt32();
    }
    if (version[0] > 2020 || version[0] === 2020 && version[1] >= 2) { // 2020.2 and up
      /* const m_PlatformBlob = */ reader.readUInt8Array();
      reader.alignStream();
    }
    const imageDataSize = reader.readInt32();
    if (imageDataSize === 0 && (version[0] === 5 && version[1] >= 3 || version[0] > 5)) { // 5.3.0 and up
      this.m_StreamData = new StreamingInfo(reader);
    }
    let resourceReader = null;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.m_StreamData?.path) {
    // if (!String.IsNullOrEmpty(this.m_StreamData?.path)) {
      resourceReader = new ResourceReader(this.m_StreamData.path, this.assetsFile, this.m_StreamData.offset, this.m_StreamData.size);
    } else {
      resourceReader = new ResourceReader(reader, reader.position, imageDataSize);
    }
    this.imageData = resourceReader;
  }
}
export enum TextureFormat {
  Alpha8 = 1,
  ARGB4444,
  RGB24,
  RGBA32,
  ARGB32,
  RGB565 = 7,
  R16 = 9,
  DXT1,
  DXT5 = 12,
  RGBA4444,
  BGRA32,
  RHalf,
  RGHalf,
  RGBAHalf,
  RFloat,
  RGFloat,
  RGBAFloat,
  YUY2,
  RGB9e5Float,
  BC4 = 26,
  BC5,
  BC6H = 24,
  BC7,
  DXT1Crunched = 28,
  DXT5Crunched,
  PVRTC_RGB2,
  PVRTC_RGBA2,
  PVRTC_RGB4,
  PVRTC_RGBA4,
  ETC_RGB4,
  ATC_RGB4,
  ATC_RGBA8,
  EAC_R = 41,
  EAC_R_SIGNED,
  EAC_RG,
  EAC_RG_SIGNED,
  ETC2_RGB,
  ETC2_RGBA1,
  ETC2_RGBA8,
  ASTC_RGB_4x4,
  ASTC_RGB_5x5,
  ASTC_RGB_6x6,
  ASTC_RGB_8x8,
  ASTC_RGB_10x10,
  ASTC_RGB_12x12,
  ASTC_RGBA_4x4,
  ASTC_RGBA_5x5,
  ASTC_RGBA_6x6,
  ASTC_RGBA_8x8,
  ASTC_RGBA_10x10,
  ASTC_RGBA_12x12,
  ETC_RGB4_3DS,
  ETC_RGBA8_3DS,
  RG16,
  R8,
  ETC_RGB4Crunched,
  ETC2_RGBA8Crunched,
  ASTC_HDR_4x4,
  ASTC_HDR_5x5,
  ASTC_HDR_6x6,
  ASTC_HDR_8x8,
  ASTC_HDR_10x10,
  ASTC_HDR_12x12,
  RG32,
  RGB48,
  RGBA64
}
