/* eslint-disable @typescript-eslint/naming-convention */
import type { SerializedType } from './SerializedType';
export default class ObjectInfo {
  public byteStart!: long;
  public byteSize!: uint;
  public typeID!: int;
  public classID!: int;
  public isDestroyed!: ushort;
  public stripped!: byte;
  public m_PathID!: bigint;
  public serializedType!: SerializedType;
}
