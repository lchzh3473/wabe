/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable camelcase */
import BinaryReader from '../BinaryReader';
import EndianType from './EndianType';
import { FileType } from './type/FileType';
const gzipMagic = '\x1f\x8b';
const brotliMagic = 'brotli';
const zipMagic = 'PK\x03\x04';
const zipSpannedMagic = 'PK\x07\x08';
export default class UnityFileReader extends BinaryReader {
  public fullPath: string;
  public fileName: string;
  public fileType: FileType;
  public constructor(path: string, stream: Uint8Array) {
    super(stream, EndianType.BigEndian);
    this.fullPath = path;
    this.fileName = path.split('/').pop()!;
    this.fileType = this.checkFileType();
  }
  public checkFileType(): FileType {
    const signature = this.readStringToNull(20);
    this.position = 0;
    switch (signature) {
      case 'UnityWeb':
      case 'UnityRaw':
      case 'UnityArchive':
      case 'UnityFS':
        return FileType.BundleFile;
      case 'UnityWebData1.0':
        return FileType.WebFile;
      default: {
        let magic = this.readString(2);
        this.position = 0;
        if (magic === gzipMagic) return FileType.GZipFile;
        this.position = 0x20;
        magic = this.readString(6);
        this.position = 0;
        if (magic === brotliMagic) return FileType.BrotliFile;
        if (this.isSerializedFile()) return FileType.AssetsFile;
        magic = this.readString(4);
        this.position = 0;
        if (magic === zipMagic || magic === zipSpannedMagic) return FileType.ZipFile;
        return FileType.ResourceFile;
      }
    }
  }
  public isSerializedFile(): boolean {
    const fileSize = this.length;
    if (this.length < 20) return false;
    // this.skip(4);
    /* let m_MetadataSize = */ this.readUint32();
    let m_FileSize = this.readUint32();
    const m_Version = this.readUint32();
    let m_DataOffset = this.readUint32();
    /* const m_Endianess = */ this.readByte();
    /* const m_Reserved = */ this.readBytes(3);
    if (m_Version >= 22) {
      if (fileSize < 48) {
        this.position = 0;
        return false;
      }
      /* m_MetadataSize = */ this.readUint32();
      m_FileSize = Number(this.readInt64());
      m_DataOffset = Number(this.readInt64());
    }
    this.position = 0;
    if (m_FileSize !== fileSize) return false;
    if (m_DataOffset > m_FileSize) return false;
    return true;
  }
}
