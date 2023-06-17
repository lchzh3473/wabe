/* eslint-disable camelcase */
/* eslint-disable radix */
/* eslint-disable @typescript-eslint/naming-convention */
import { CommonString } from './CommonString';
import BinaryReader from '../BinaryReader';
import type AssetsManager from './AssetsManager';
import type UnityFileReader from './UnityReader';
import BuildType from './BuildType';
import SerializedFileHeader from './SerializedFileHeader';
import BuildTarget from './BuildTarget';
import SerializedFileFormatVersion from './SerializedFileFormatVersion';
import EndianType from './EndianType';
import TypeTreeNode from './TypeTreeNode';
import { SerializedType } from './SerializedType';
import TypeTree from './TypeTree';
import LocalSerializedObjectIdentifier from './LocalSerializedObjectIdentifier';
import FileIdentifier from './FileIdentifier';
import ObjectInfo from './ObjectInfo';
import type UnityObject from './UnityObject';
const strippedVersion = '0.0.0';
export default class SerializedFile {
  public assetsManager: AssetsManager;
  public reader: UnityFileReader;
  public fullName: string;
  public originalPath!: string;
  public fileName: string;
  public version = [0, 0, 0, 0];
  public buildType!: BuildType;
  public objects: UnityObject[];
  public objectsDic: Record<string, UnityObject>;
  public header: SerializedFileHeader;
  private readonly m_FileEndianess: byte;
  public unityVersion = '2.5.0f5';
  public m_TargetPlatform = BuildTarget.UnknownPlatform;
  public m_EnableTypeTree = true;
  public m_Types: SerializedType[];
  public bigIDEnabled = 0;
  public m_Objects!: ObjectInfo[];
  public m_ScriptTypes!: LocalSerializedObjectIdentifier[];
  public m_Externals: FileIdentifier[];
  public m_RefTypes!: SerializedType[];
  public userInformation!: string;
  public constructor(reader: UnityFileReader, assetsManager: AssetsManager) {
    this.assetsManager = assetsManager;
    this.reader = reader;
    this.fullName = reader.fullPath;
    this.fileName = reader.fileName;
    // ReadHeader
    this.header = new SerializedFileHeader();
    this.header.m_MetadataSize = reader.readUint32();
    this.header.m_FileSize = reader.readUint32();
    this.header.m_Version = reader.readUint32();
    this.header.m_DataOffset = reader.readUint32();
    // header
    if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_9) {
      this.header.m_Endianess = reader.readByte();
      this.header.m_Reserved = reader.readBytes(3);
      this.m_FileEndianess = this.header.m_Endianess;
    } else {
      reader.position = this.header.m_FileSize - this.header.m_MetadataSize;
      this.m_FileEndianess = reader.readByte();
    }
    if (this.header.m_Version >= SerializedFileFormatVersion.LargeFilesSupport) {
      this.header.m_MetadataSize = reader.readUint32();
      this.header.m_FileSize = reader.readUint64n();
      this.header.m_DataOffset = reader.readUint64n();
      reader.readInt64(); // unknown
    }
    // ReadMetadata
    if (this.m_FileEndianess === 0) {
      reader.endian = EndianType.LittleEndian;
    }
    if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_7) {
      this.unityVersion = reader.readStringToNull();
      this.setVersion(this.unityVersion);
    }
    if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_8) {
      this.m_TargetPlatform = reader.readInt32() as BuildTarget;
      if (BuildTarget[this.m_TargetPlatform] === undefined) {
        console.warn(`Unknown BuildTarget: ${this.m_TargetPlatform}`);
        this.m_TargetPlatform = BuildTarget.UnknownPlatform;
      }
    }
    if (this.header.m_Version >= SerializedFileFormatVersion.HasTypeTreeHashes) {
      this.m_EnableTypeTree = reader.readBoolean();
    }
    // Read Types
    const typesCount = reader.readInt32();
    this.m_Types = [];
    for (let i = 0; i < typesCount; i++) {
      this.m_Types.push(this.readSerializedType(false));
    }
    if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_7 && this.header.m_Version < SerializedFileFormatVersion.Unknown_14) {
      this.bigIDEnabled = reader.readInt32();
    }
    // Read Objects
    const objectCount = reader.readInt32();
    this.m_Objects = [];
    this.objects = [];
    this.objectsDic = {};
    for (let i = 0; i < objectCount; i++) {
      const objectInfo = new ObjectInfo();
      if (this.bigIDEnabled !== 0) {
        objectInfo.m_PathID = reader.readInt64();
      } else if (this.header.m_Version < SerializedFileFormatVersion.Unknown_14) {
        objectInfo.m_PathID = BigInt(reader.readInt32());
      } else {
        reader.alignStream(4);
        objectInfo.m_PathID = reader.readInt64();
      }
      if (this.header.m_Version >= SerializedFileFormatVersion.LargeFilesSupport) {
        objectInfo.byteStart = reader.readInt64n();
      } else {
        objectInfo.byteStart = reader.readUint32();
      }
      objectInfo.byteStart += this.header.m_DataOffset;
      objectInfo.byteSize = reader.readUint32();
      objectInfo.typeID = reader.readInt32();
      if (this.header.m_Version < SerializedFileFormatVersion.RefactoredClassId) {
        objectInfo.classID = reader.readUint16();
        objectInfo.serializedType = this.m_Types.find(t => t.classID === objectInfo.typeID)!;
      } else {
        const type = this.m_Types[objectInfo.typeID];
        objectInfo.serializedType = type;
        objectInfo.classID = type.classID;
      }
      if (this.header.m_Version < SerializedFileFormatVersion.HasScriptTypeIndex) {
        objectInfo.isDestroyed = reader.readUint16();
      }
      if (this.header.m_Version >= SerializedFileFormatVersion.HasScriptTypeIndex && this.header.m_Version < SerializedFileFormatVersion.RefactorTypeData) {
        const scriptTypeIndex = reader.readInt16();
        if (objectInfo.serializedType != null) {
          objectInfo.serializedType.m_ScriptTypeIndex = scriptTypeIndex;
        }
      }
      if (this.header.m_Version === SerializedFileFormatVersion.SupportsStrippedObject || this.header.m_Version === SerializedFileFormatVersion.RefactoredClassId) {
        objectInfo.stripped = reader.readByte();
      }
      this.m_Objects.push(objectInfo);
    }
    // scripts
    if (this.header.m_Version >= SerializedFileFormatVersion.HasScriptTypeIndex) {
      const scriptCount = reader.readInt32();
      this.m_ScriptTypes = [];
      for (let i = 0; i < scriptCount; i++) {
        const scriptType = new LocalSerializedObjectIdentifier();
        scriptType.localSerializedFileIndex = reader.readInt32();
        if (this.header.m_Version < SerializedFileFormatVersion.Unknown_14) {
          scriptType.localIdentifierInFile = BigInt(reader.readInt32());
        } else {
          reader.alignStream();
          scriptType.localIdentifierInFile = reader.readInt64();
        }
        this.m_ScriptTypes.push(scriptType);
      }
    }
    // externals
    const externalCount = reader.readInt32();
    this.m_Externals = [];
    for (let i = 0; i < externalCount; i++) {
      const m_External = new FileIdentifier();
      if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_6) reader.readStringToNull();
      if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_5) {
        m_External.guid = reader.readBytes(16); // new Guid(reader.readBytes(16));
        m_External.type = reader.readInt32();
      }
      m_External.pathName = reader.readStringToNull();
      m_External.fileName = m_External.pathName.split('/').pop()!;
      this.m_Externals.push(m_External);
    }
    // ref types
    if (this.header.m_Version >= SerializedFileFormatVersion.SupportsRefObject) {
      const refTypesCount = reader.readInt32();
      this.m_RefTypes = [];
      for (let i = 0; i < refTypesCount; i++) {
        this.m_RefTypes.push(this.readSerializedType(true));
      }
    }
    if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_5) {
      this.userInformation = reader.readStringToNull();
    }
    // this.reader.alignStream(16);
  }
  public setVersion(stringVersion: string): void {
    if (stringVersion !== strippedVersion) {
      this.unityVersion = stringVersion;
      const buildSplit = stringVersion.replace(/\d/g, '').split('.').filter(v => v !== '');
      this.buildType = new BuildType(buildSplit[0]);
      const versionSplit = stringVersion.replace(/\D/g, '.').split('.').filter(v => v !== '');
      this.version = versionSplit.map(v => parseInt(v));
      // var buildSplit = Regex.Replace(stringVersion, @"\d", "").Split(new[] { "." }, StringSplitOptions.RemoveEmptyEntries);
      // buildType = new BuildType(buildSplit[0]);
      // var versionSplit = Regex.Replace(stringVersion, @"\D", ".").Split(new[] { "." }, StringSplitOptions.RemoveEmptyEntries);
      // version = versionSplit.Select(int.Parse).ToArray();
    }
  }
  private readSerializedType(isRefType: boolean) {
    const { reader } = this;
    const type = new SerializedType();
    type.classID = reader.readInt32();
    if (this.header.m_Version >= SerializedFileFormatVersion.RefactoredClassId) type.m_IsStrippedType = reader.readBoolean();
    if (this.header.m_Version >= SerializedFileFormatVersion.RefactorTypeData) type.m_ScriptTypeIndex = reader.readUint16();
    if (this.header.m_Version >= SerializedFileFormatVersion.HasTypeTreeHashes) {
      if (this.header.m_Version < SerializedFileFormatVersion.RefactoredClassId && type.classID < 0 || this.header.m_Version >= SerializedFileFormatVersion.RefactoredClassId && type.classID === 114) type.m_ScriptID = reader.readBytes(16);
      type.m_OldTypeHash = reader.readBytes(16);
    }
    if (this.m_EnableTypeTree) {
      type.m_Type = new TypeTree();
      type.m_Type.m_Nodes = [];
      if (this.header.m_Version >= SerializedFileFormatVersion.Unknown_12 || this.header.m_Version === SerializedFileFormatVersion.Unknown_10) {
        this.typeTreeBlobRead(type.m_Type);
      } else {
        this.readTypeTree(type.m_Type);
      }
      if (this.header.m_Version >= SerializedFileFormatVersion.StoresTypeDependencies) {
        if (isRefType) {
          type.m_KlassName = reader.readStringToNull();
          type.m_NameSpace = reader.readStringToNull();
          type.m_AsmName = reader.readStringToNull();
        } else {
          type.m_TypeDependencies = reader.readInt32Array();
        }
      }
    }
    return type;
  }
  private readTypeTree(m_Type: TypeTree, level = 0) {
    const typeTreeNode = new TypeTreeNode();
    m_Type.m_Nodes.push(typeTreeNode);
    typeTreeNode.m_Level = level;
    typeTreeNode.m_Type = this.reader.readStringToNull();
    typeTreeNode.m_Name = this.reader.readStringToNull();
    typeTreeNode.m_ByteSize = this.reader.readInt32();
    if (this.header.m_Version === SerializedFileFormatVersion.Unknown_2) this.reader.skip(4);
    if (this.header.m_Version === SerializedFileFormatVersion.Unknown_3) typeTreeNode.m_Index = this.reader.readInt32();
    typeTreeNode.m_TypeFlags = this.reader.readInt32();
    typeTreeNode.m_Version = this.reader.readInt32();
    if (this.header.m_Version !== SerializedFileFormatVersion.Unknown_3) typeTreeNode.m_MetaFlag = this.reader.readInt32();
    const len = this.reader.readInt32();
    for (let i = 0; i < len; i++) this.readTypeTree(m_Type, level + 1);
  }
  private typeTreeBlobRead(m_Type: TypeTree) {
    const { reader } = this;
    const numberOfNodes = reader.readInt32();
    const stringBufferSize = reader.readInt32();
    for (let i = 0; i < numberOfNodes; i++) {
      const typeTreeNode = new TypeTreeNode();
      m_Type.m_Nodes.push(typeTreeNode);
      typeTreeNode.m_Version = reader.readUint16();
      typeTreeNode.m_Level = reader.readByte();
      typeTreeNode.m_TypeFlags = reader.readByte();
      typeTreeNode.m_TypeStrOffset = reader.readUint32();
      typeTreeNode.m_NameStrOffset = reader.readUint32();
      typeTreeNode.m_ByteSize = reader.readInt32();
      typeTreeNode.m_Index = reader.readInt32();
      typeTreeNode.m_MetaFlag = reader.readInt32();
      if (this.header.m_Version >= SerializedFileFormatVersion.TypeTreeNodeWithTypeFlags) typeTreeNode.m_RefTypeHash = reader.readUint64n();
    }
    m_Type.m_StringBuffer = reader.readBytes(stringBufferSize);
    const bufferReader = new BinaryReader(m_Type.m_StringBuffer);
    const readString = (stringBufferReader: BinaryReader, value: uint) => {
      const isOffset = (value & 0x80000000) === 0;
      if (isOffset) {
        stringBufferReader.position = value;
        return stringBufferReader.readStringToNull();
      }
      const offset0 = value & 0x7fffffff;
      return CommonString[offset0] || offset0.toString();
    };
    for (const m_Node of m_Type.m_Nodes) {
      m_Node.m_Type = readString(bufferReader, m_Node.m_TypeStrOffset);
      m_Node.m_Name = readString(bufferReader, m_Node.m_NameStrOffset);
    }
  }
  public addObject(obj: UnityObject): void {
    this.objects.push(obj);
    this.objectsDic[obj.m_PathID.toString()] = obj;
  }
}
