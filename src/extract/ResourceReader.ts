import type BinaryReader from '../BinaryReader';
import type SerializedFile from './SerializedFile';
export class ResourceReader {
  private needSearch?: boolean;
  private readonly path?: string;
  private readonly assetsFile?: SerializedFile;
  private readonly offset: number;
  private readonly size: number;
  private reader?: BinaryReader;
  public constructor(path: string, assetsFile: SerializedFile, offset: number, size: number) ;
  public constructor(reader: BinaryReader, offset: number, size: number);
  public constructor(...args: [BinaryReader, number, number] | [string, SerializedFile, number, number]) {
    if (args.length === 3) {
      const [reader, offset, size] = args;
      this.reader = reader;
      this.offset = offset;
      this.size = size;
    } else if (args.length === 4) {
      const [path, assetsFile, offset, size] = args;
      this.needSearch = true;
      this.path = path;
      this.assetsFile = assetsFile;
      this.offset = offset;
      this.size = size;
    } else {
      throw new Error('invalid arguments');
    }
  }
  private getReader(): BinaryReader {
    if (this.needSearch!) {
      const resourceFileName = this.path!.split('/').pop()!;
      this.reader = this.assetsFile!.assetsManager.resourceFileReaders[resourceFileName] as BinaryReader | undefined;
      if (this.reader) {
        this.needSearch = false;
        return this.reader;
      }
      throw new Error(`Can't find the resource file ${resourceFileName}`);
      // var resourceFileName = Path.GetFileName(path);
      // if (this.assetsFile.assetsManager.resourceFileReaders.TryGetValue(resourceFileName, /* out */ this.reader))
      // {
      //     this.needSearch = false;
      //     return this.reader;
      // }
      // var assetsFileDirectory = Path.GetDirectoryName(this.assetsFile.fullName);
      // var resourceFilePath = Path.Combine(assetsFileDirectory, resourceFileName);
      // if (!File.Exists(resourceFilePath))
      // {
      //     var findFiles = Directory.GetFiles(assetsFileDirectory, resourceFileName, SearchOption.AllDirectories);
      //     if (findFiles.Length > 0)
      //     {
      //         resourceFilePath = findFiles[0];
      //     }
      // }
      // if (File.Exists(resourceFilePath))
      // {
      //     this.needSearch = false;
      //     this.reader = new BinaryReader(File.OpenRead(resourceFilePath));
      //     this.assetsFile.assetsManager.resourceFileReaders.Add(resourceFileName, this.reader);
      //     return this.reader;
      // }
      // throw new FileNotFoundException($"Can't find the resource file {resourceFileName}");
    } else {
      return this.reader!;
    }
  }
  public getData(buff?: Uint8Array): Uint8Array {
    const binaryReader = this.getReader();
    binaryReader.position = this.offset;
    if (!buff) return binaryReader.readBytes(this.size);
    binaryReader.read(buff, 0, this.size);
    return buff;
  }
  // public byte[] GetData()
  // {
  //     var binaryReader = GetReader();
  //     binaryReader.BaseStream.Position = offset;
  //     return binaryReader.ReadBytes((int)size);
  // }
  // public void GetData(byte[] buff)
  // {
  //     var binaryReader = GetReader();
  //     binaryReader.BaseStream.Position = offset;
  //     binaryReader.Read(buff, 0, (int)size);
  // }
  public writeData(path: string): void {
    const binaryReader = this.getReader();
    binaryReader.position = this.offset;
    console.log('writeData', path);
    throw new Error('ResourceReader.writeData not implemented');
  }
  // public void WriteData(string path)
  // {
  //     var binaryReader = GetReader();
  //     binaryReader.BaseStream.Position = offset;
  //     using (var writer = File.OpenWrite(path))
  //     {
  //         binaryReader.BaseStream.CopyTo(writer, size);
  //     }
  // }
}
