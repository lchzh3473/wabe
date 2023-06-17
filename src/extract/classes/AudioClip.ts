/* eslint-disable @typescript-eslint/naming-convention */
import { ResourceReader } from '../ResourceReader';
import type { ObjectReader } from '../ObjectReader';
import { NamedObject } from '../UnityObject';
export class AudioClip extends NamedObject {
  public m_Format?: int;
  public m_Type?: FMODSoundType;
  public m_3D?: bool;
  public m_UseHardware?: bool;
  // version 5
  public m_LoadType?: int;
  public m_Channels?: int;
  public m_Frequency?: int;
  public m_BitsPerSample?: int;
  public m_Length?: float;
  public m_IsTrackerFormat?: bool;
  public m_SubsoundIndex?: int;
  public m_PreloadAudioData?: bool;
  public m_LoadInBackground?: bool;
  public m_Legacy3D?: bool;
  public m_CompressionFormat?: AudioCompressionFormat;
  public m_Source?: string;
  public m_Offset?: long; // ulong
  public m_Size: long; // ulong
  public m_AudioData: ResourceReader;
  public constructor(reader: ObjectReader) {
    super(reader);
    const { version } = reader;
    if (version[0] < 5) {
      this.m_Format = reader.readInt32();
      this.m_Type = reader.readInt32();
      this.m_3D = reader.readBoolean();
      this.m_UseHardware = reader.readBoolean();
      reader.alignStream();
      if (version[0] >= 4 || version[0] === 3 && version[1] >= 2) { // 3.2.0 to 5
        /* const m_Stream = */ reader.readInt32();
        this.m_Size = reader.readInt32();
        const tsize = this.m_Size % 4 === 0 ? this.m_Size : this.m_Size + 4 - this.m_Size % 4;
        if (reader.byteSize + reader.byteStart - reader.position !== tsize) {
          this.m_Offset = reader.readUint32();
          this.m_Source = `${this.assetsFile.fullName}.resS`;
        }
      } else {
        this.m_Size = reader.readInt32();
      }
    } else {
      this.m_LoadType = reader.readInt32();
      this.m_Channels = reader.readInt32();
      this.m_Frequency = reader.readInt32();
      this.m_BitsPerSample = reader.readInt32();
      this.m_Length = reader.readSingle();
      this.m_IsTrackerFormat = reader.readBoolean();
      reader.alignStream();
      this.m_SubsoundIndex = reader.readInt32();
      this.m_PreloadAudioData = reader.readBoolean();
      this.m_LoadInBackground = reader.readBoolean();
      this.m_Legacy3D = reader.readBoolean();
      reader.alignStream();
      // StreamedResource this.m_Resource
      this.m_Source = reader.readAlignedString();
      this.m_Offset = reader.readInt64n();
      this.m_Size = reader.readInt64n();
      this.m_CompressionFormat = reader.readInt32();
    }
    let resourceReader = null;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.m_Source) {
      // resourceReader = new ResourceReader(this.m_Source, this.assetsFile, this.m_Offset, this.m_Size);
      resourceReader = new ResourceReader(this.m_Source, this.assetsFile, this.m_Offset!, this.m_Size);
    } else {
      // resourceReader = new ResourceReader(reader, reader.BaseStream.Position, this.m_Size);
      resourceReader = new ResourceReader(reader, reader.position, this.m_Size);
    }
    this.m_AudioData = resourceReader;
  }
}
enum FMODSoundType {
  UNKNOWN = 0,
  ACC = 1,
  AIFF = 2,
  ASF = 3,
  AT3 = 4,
  CDDA = 5,
  DLS = 6,
  FLAC = 7,
  FSB = 8,
  GCADPCM = 9,
  IT = 10,
  MIDI = 11,
  MOD = 12,
  MPEG = 13,
  OGGVORBIS = 14,
  PLAYLIST = 15,
  RAW = 16,
  S3M = 17,
  SF2 = 18,
  USER = 19,
  WAV = 20,
  XM = 21,
  XMA = 22,
  VAG = 23,
  AUDIOQUEUE = 24,
  XWMA = 25,
  BCWAV = 26,
  AT9 = 27,
  VORBIS = 28,
  MEDIA_FOUNDATION = 29
}
enum AudioCompressionFormat {
  PCM = 0,
  Vorbis = 1,
  ADPCM = 2,
  MP3 = 3,
  PSMVAG = 4,
  HEVAG = 5,
  XMA = 6,
  AAC = 7,
  GCADPCM = 8,
  ATRAC9 = 9
}
