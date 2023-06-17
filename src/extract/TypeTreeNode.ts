/* eslint-disable @typescript-eslint/naming-convention */
export default class TypeTreeNode {
  public m_Type!: string;
  public m_Name!: string;
  public m_ByteSize!: int;
  public m_Index!: int;
  public m_TypeFlags!: int; // m_IsArray
  public m_Version!: int;
  public m_MetaFlag!: int;
  public m_Level!: int;
  public m_TypeStrOffset!: uint;
  public m_NameStrOffset!: uint;
  public m_RefTypeHash!: ulong;
  public constructor();
  public constructor(type: string, name: string, level: int, align: bool);
  public constructor(type?: string, name?: string, level?: int, align?: bool) {
    if (type !== undefined) {
      this.m_Type = type;
      this.m_Name = name!;
      this.m_Level = level!;
      this.m_MetaFlag = align! ? 0x4000 : 0;
    }
  }
}
