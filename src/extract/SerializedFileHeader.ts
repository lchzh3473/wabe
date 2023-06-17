/* eslint-disable @typescript-eslint/naming-convention */
import type SerializedFileFormatVersion from './SerializedFileFormatVersion';
export default class SerializedFileHeader {
  public m_MetadataSize!: uint;
  public m_FileSize!: long;
  public m_Version!: SerializedFileFormatVersion;
  public m_DataOffset!: long;
  public m_Endianess!: byte;
  public m_Reserved!: byteArray;
}
