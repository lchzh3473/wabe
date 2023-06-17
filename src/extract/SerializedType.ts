/* eslint-disable @typescript-eslint/naming-convention */
import type TypeTree from './TypeTree';
export class SerializedType {
  public classID!: int;
  public m_IsStrippedType!: bool;
  public m_ScriptTypeIndex: short = -1;
  public m_Type!: TypeTree;
  public m_ScriptID!: byteArray; // Hash128
  public m_OldTypeHash!: byteArray; // Hash128
  public m_TypeDependencies!: Int32Array;
  public m_KlassName!: string;
  public m_NameSpace!: string;
  public m_AsmName!: string;
}
