/* eslint-disable @typescript-eslint/prefer-enum-initializers */
/* eslint-disable @typescript-eslint/naming-convention */
import BinaryReader from '../BinaryReader';
import decodeBlockLZ4 from '../lz4/decodeBlockLZ4';
import { StreamFile } from './StreamFile';
import type UnityFileReader from './UnityReader';
const enum ArchiveFlags {
  CompressionTypeMask = 0x3f,
  BlocksAndDirectoryInfoCombined = 0x40,
  BlocksInfoAtTheEnd = 0x80,
  OldWebPluginCompatibility = 0x100,
  BlockInfoNeedPaddingAtStart = 0x200
}
const enum StorageBlockFlags {
  CompressionTypeMask = 0x3f,
  Streamed = 0x40
}
const enum CompressionType {
  None,
  Lzma,
  Lz4,
  Lz4HC,
  Lzham
}
class BundleFileHeader {
  public signature?: string;
  public version?: uint;
  public unityVersion?: string;
  public unityRevision?: string;
  public size?: long;
  public compressedBlocksInfoSize?: uint;
  public uncompressedBlocksInfoSize?: uint;
  public flags?: ArchiveFlags;
}
class BundleFileStorageBlock {
  public compressedSize?: uint;
  public uncompressedSize?: uint;
  public flags?: StorageBlockFlags;
}
class BundleFileNode {
  public offset?: long;
  public size?: long;
  public flags?: uint;
  public path?: string;
}
export default class BundleFile {
  public m_Header: BundleFileHeader;
  public m_BlocksInfo: BundleFileStorageBlock[];
  public m_DirectoryInfo: BundleFileNode[];
  public fileList: StreamFile[];
  public constructor(reader: UnityFileReader) {
    this.fileList = [];
    this.m_BlocksInfo = [];
    this.m_DirectoryInfo = [];
    this.m_Header = new BundleFileHeader();
    this.m_Header.signature = reader.readStringToNull();
    this.m_Header.version = reader.readUint32();
    this.m_Header.unityVersion = reader.readStringToNull();
    this.m_Header.unityRevision = reader.readStringToNull();
    const readAsUnityFS = () => {
      this.readHeader(reader);
      this.readBlocksInfoAndDirectory(reader);
      const blocksStream = this.createBlocksStream(reader.fullPath);
      this.readBlocks(reader, blocksStream);
      this.readFiles(blocksStream, reader.fullPath);
      console.log(this.fileList);
    };
    const readAsUnityRaw = () => {
      if (this.m_Header.version === 6) readAsUnityFS();
      this.readHeaderAndBlockInfo(reader);
      const blocksStream = this.createBlocksStream(reader.fullPath);
      this.readBlocksAndDirectory(reader, blocksStream);
      this.readFiles(blocksStream, reader.fullPath);
    };
    switch (this.m_Header.signature) {
      case 'UnityArchive':
        throw new Error('not supported');
      case 'UnityWeb':
      case 'UnityRaw': {
        readAsUnityRaw();
        break;
      }
      case 'UnityFS':
        readAsUnityFS();
        break;
      default:
        throw new Error('not supported');
    }
  }
  private readHeaderAndBlockInfo(reader: BinaryReader) {
    if (this.m_Header.version! >= 4) {
      /* const hash = */ reader.readBytes(16);
      /* const crc = */ reader.readUint32();
    }
    /* const minimumStreamedBytes = */ reader.readUint32();
    this.m_Header.size = reader.readUint32();
    /* const numberOfLevelsToDownloadBeforeStreaming = */ reader.readUint32();
    const levelCount = reader.readInt32();
    this.m_BlocksInfo = [new BundleFileStorageBlock()];
    for (let i = 0; i < levelCount; i++) {
      const storageBlock = new BundleFileStorageBlock();
      storageBlock.compressedSize = reader.readUint32();
      storageBlock.uncompressedSize = reader.readUint32();
      if (i === levelCount - 1) {
        this.m_BlocksInfo[0] = storageBlock;
      }
    }
    if (this.m_Header.version! >= 2) {
      /* const completeFileSize = */ reader.readUint32();
    }
    if (this.m_Header.version! >= 3) {
      /* const fileInfoHeaderSize = */ reader.readUint32();
    }
    reader.position = this.m_Header.size;
  }
  private readHeader(reader: BinaryReader) {
    this.m_Header.size = reader.readInt64n();
    this.m_Header.compressedBlocksInfoSize = reader.readUint32();
    this.m_Header.uncompressedBlocksInfoSize = reader.readUint32();
    this.m_Header.flags = reader.readUint32();
    if (this.m_Header.signature !== 'UnityFS') reader.readByte();
  }
  private createBlocksStream(_path: string) {
    const uncompressedSizeSum = this.m_BlocksInfo.reduce((a, b) => a + b.uncompressedSize!, 0);
    const blockStream = new Uint8Array(uncompressedSizeSum);
    return blockStream;
  }
  private readBlocksAndDirectory(reader: BinaryReader, blocksStream: Stream) {
    const isCompressed = this.m_Header.signature === 'UnityWeb';
    for (const blockInfo of this.m_BlocksInfo) {
      const uncompressedBytes = reader.readBytes(blockInfo.compressedSize!);
      if (isCompressed) {
        // using (var memoryStream = new MemoryStream(uncompressedBytes))
        // {
        //     using (var decompressStream = SevenZipHelper.StreamDecompress(memoryStream))
        //     {
        //         uncompressedBytes = decompressStream.ToArray();
        //     }
        // }
        throw new Error('sorry, dont support UnityWeb compress');
      }
      uncompressedBytes.set(blocksStream, 0);
    }
    const blocksReader = new /* Endian */BinaryReader(blocksStream);
    const nodesCount = blocksReader.readInt32();
    this.m_DirectoryInfo = [];
    for (let i = 0; i < nodesCount; i++) {
      const node = new BundleFileNode();
      node.path = blocksReader.readStringToNull();
      node.offset = blocksReader.readUint32();
      node.size = blocksReader.readUint32();
      this.m_DirectoryInfo[i] = node;
    }
  }
  private readFiles(blocksStream: Stream, path: string) {
    this.fileList = [];
    for (const node of this.m_DirectoryInfo) {
      const file = new StreamFile();
      file.path = node.path;
      file.fileName = node.path!.split('/').pop()!;
      console.log('readFiles:', path, node.size! >= 2147483647);
      file.stream = blocksStream.subarray(node.offset, node.offset! + node.size!);
      this.fileList.push(file);
    }
  }
  private readBlocksInfoAndDirectory(reader: BinaryReader) {
    let blocksInfoBytes = new Uint8Array();
    if (this.m_Header.version! >= 7) reader.alignStream(16);
    if (this.m_Header.flags! & ArchiveFlags.BlocksInfoAtTheEnd) {
      const { position } = reader;
      reader.position = reader.length - this.m_Header.compressedBlocksInfoSize!;
      blocksInfoBytes = reader.readBytes(this.m_Header.compressedBlocksInfoSize!);
      reader.position = position;
    } else { // 0x40 BlocksAndDirectoryInfoCombined
      blocksInfoBytes = reader.readBytes(this.m_Header.compressedBlocksInfoSize!);
    }
    let blocksInfoUncompresseddStream = new Uint8Array();
    const uncompressedSize = this.m_Header.uncompressedBlocksInfoSize;
    const compressionType = (this.m_Header.flags! & ArchiveFlags.CompressionTypeMask) as CompressionType;
    switch (compressionType) {
      case CompressionType.None:
        blocksInfoUncompresseddStream = blocksInfoBytes;
        break;
      case CompressionType.Lzma:
        throw new Error('sorry, dont support LZMA compress');
        // blocksInfoUncompresseddStream = new MemoryStream((int)(uncompressedSize));
        // using (var blocksInfoCompressedStream = new MemoryStream(blocksInfoBytes))
        // {
        //     SevenZipHelper.StreamDecompress(blocksInfoCompressedStream, blocksInfoUncompresseddStream, m_Header.compressedBlocksInfoSize, m_Header.uncompressedBlocksInfoSize);
        // }
        // blocksInfoUncompresseddStream.Position = 0;
        // break;
      case CompressionType.Lz4:
      case CompressionType.Lz4HC:
        blocksInfoUncompresseddStream = decodeBlockLZ4(blocksInfoBytes, uncompressedSize!);
        break;
        // var uncompressedBytes = new byte[uncompressedSize];
        // var numWrite = LZ4Codec.Decode(blocksInfoBytes, uncompressedBytes);
        // if (numWrite != uncompressedSize)
        // {
        //     throw new IOException($"Lz4 decompression error, write {numWrite} bytes but expected {uncompressedSize} bytes");
        // }
        // blocksInfoUncompresseddStream = new MemoryStream(uncompressedBytes);
        // break;
      default:
        throw new Error(`Unsupported compression type ${compressionType}`);
    }
    const blocksInfoReader = new /* Endian */BinaryReader(blocksInfoUncompresseddStream);
    /* const uncompressedDataHash = */ blocksInfoReader.readBytes(16);
    const blocksInfoCount = blocksInfoReader.readInt32();
    this.m_BlocksInfo = [];
    for (let i = 0; i < blocksInfoCount; i++) {
      const block = new BundleFileStorageBlock();
      block.uncompressedSize = blocksInfoReader.readUint32();
      block.compressedSize = blocksInfoReader.readUint32();
      block.flags = blocksInfoReader.readUint16() as StorageBlockFlags;
      this.m_BlocksInfo[i] = block;
    }
    const nodesCount = blocksInfoReader.readInt32();
    this.m_DirectoryInfo = [];
    for (let i = 0; i < nodesCount; i++) {
      const node = new BundleFileNode();
      node.offset = blocksInfoReader.readInt64n();
      node.size = blocksInfoReader.readInt64n();
      node.flags = blocksInfoReader.readUint32();
      node.path = blocksInfoReader.readStringToNull();
      this.m_DirectoryInfo[i] = node;
    }
    if (this.m_Header.flags! & ArchiveFlags.BlockInfoNeedPaddingAtStart) {
      reader.alignStream(16);
    }
  }
  private readBlocks(reader: BinaryReader, blocksStream: Stream) {
    let offset = 0;
    for (const blockInfo of this.m_BlocksInfo) {
      const compressionType = (blockInfo.flags! & StorageBlockFlags.CompressionTypeMask) as CompressionType;
      switch (compressionType) {
        case CompressionType.None:
          blocksStream.set(reader.readBytes(blockInfo.uncompressedSize!), offset);
          offset += blockInfo.uncompressedSize!;
          break;
        case CompressionType.Lzma:
          throw new Error('sorry, dont support LZMA compress');
          // SevenZipHelper.StreamDecompress(reader.BaseStream, blocksStream, blockInfo.compressedSize, blockInfo.uncompressedSize);
          // break;
        case CompressionType.Lz4:
        case CompressionType.Lz4HC:
          blocksStream.set(decodeBlockLZ4(reader.readBytes(blockInfo.compressedSize!), blockInfo.uncompressedSize!), offset);
          offset += blockInfo.uncompressedSize!;
          break;
        default:
          throw new Error(`Unsupported compression type ${compressionType}`);
      }
    }
  }
}
