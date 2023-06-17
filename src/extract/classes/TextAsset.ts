/* eslint-disable @typescript-eslint/naming-convention */
import type { ObjectReader } from '../ObjectReader';
import { NamedObject } from '../UnityObject';
export class TextAsset extends NamedObject {
  public m_Script: Uint8Array;
  public constructor(reader: ObjectReader) {
    super(reader);
    this.m_Script = reader.readUInt8Array();
  }
}
