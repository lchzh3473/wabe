import EndianType from './extract/EndianType';
class BinaryReader {
  public readonly buffer: Uint8Array;
  public readonly length: number;
  private _position: number;
  public constructor(stream: ArrayBuffer, offset = 0, length = stream.byteLength - offset) {
    this.buffer = new Uint8Array(stream, offset, length);
    this._position = 0;
    this.length = length;
  }
  public get position() {
    return this._position;
  }
  public set position(newPos) {
    if (newPos >= 0) this._position = newPos;
    else this._position = this.length - newPos;
  }
  public offset(offset: number) {
    this._position = offset;
    return this;
  }
  public skip(count: number) {
    this._position += count;
  }
  public alignStream(alignment = 4) {
    const pos = this._position;
    const mod = pos % alignment;
    if (mod !== 0) this._position += alignment - mod;
  }
  public readByte(): number {
    return this.buffer[this._position++];
  }
  public readBytes(count: number) {
    return this.buffer.subarray(this._position, this._position += count);
  }
  public read(buffer: Uint8Array, index: number, count: number) {
    // c# BinaryReader.Read
    buffer.set(this.readBytes(count), index);
    // return count;
  }
}
export default class EndianBinaryReader extends BinaryReader {
  private readonly _stream: DataView;
  private littleEndian: boolean;
  public constructor(stream: Uint8Array, endian = EndianType.BigEndian) {
    super(stream.buffer, stream.byteOffset, stream.byteLength);
    this._stream = new DataView(stream.buffer, stream.byteOffset, stream.byteLength);
    this.littleEndian = endian === EndianType.LittleEndian;
    this.endian = endian;
  }
  public get endian(): EndianType {
    return this.littleEndian ? EndianType.LittleEndian : EndianType.BigEndian;
  }
  public set endian(endian: EndianType) {
    this.littleEndian = endian === EndianType.LittleEndian;
  }
  public readBoolean(): boolean {
    return Boolean(this.readBytes(1)[0]);
  }
  public readString(length: number, encoding = 'utf-8'): string {
    return new TextDecoder(encoding).decode(this.readBytes(length)).replace(/\0+$/, ''); // trim \0
  }
  public readAlignedString(): string {
    const str = this.readString(this.readUint32());
    this.alignStream(4);
    return str;
  }
  public readStringToNull(limit?: number): string {
    const maxSize = limit ?? this.length;
    const { buffer } = this;
    let counter = 0;
    while (buffer[this.position + counter] !== 0 && counter++ < maxSize);
    const barr = buffer.subarray(this.position, this.position + counter);
    this.position += counter + 1;
    return new TextDecoder('utf-8').decode(barr);
  }
  public readUInt8Array(): Uint8Array {
    const length = this.readUint32();
    const arr = this.readBytes(length);
    return arr;
  }
  public readInt32Array(): Int32Array {
    const length = this.readUint32();
    const arr = new Int32Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = this.readInt32();
    }
    return arr;
  }
  public readInt16(): number {
    const val = this._stream.getInt16(this.position, this.littleEndian);
    this.position += 2;
    return val;
  }
  public readInt32(): number {
    const val = this._stream.getInt32(this.position, this.littleEndian);
    this.position += 4;
    return val;
  }
  public readInt64(): bigint {
    const val = this._stream.getBigInt64(this.position, this.littleEndian);
    this.position += 8;
    return val;
  }
  public readInt64n(): number {
    const val = this.readInt64();
    if (val > Number.MAX_SAFE_INTEGER) throw new Error('i64n: value is too large to be represented as a number');
    if (val < Number.MIN_SAFE_INTEGER) throw new Error('i64n: value is too small to be represented as a number');
    return Number(val);
  }
  public readUint16(): number {
    const val = this._stream.getUint16(this.position, this.littleEndian);
    this.position += 2;
    return val;
  }
  public readUint32(): number {
    const val = this._stream.getUint32(this.position, this.littleEndian);
    this.position += 4;
    return val;
  }
  public readUint64(): bigint {
    const val = this._stream.getBigUint64(this.position, this.littleEndian);
    this.position += 8;
    return val;
  }
  public readUint64n(): number {
    const val = this.readUint64();
    // console.log(val);
    if (val > Number.MAX_SAFE_INTEGER) throw new Error('u64n: value is too large to be represented as a number');
    if (val < Number.MIN_SAFE_INTEGER) throw new Error('u64n: value is too small to be represented as a number');
    return Number(val);
  }
  public readSingle(): number {
    const val = this._stream.getFloat32(this.position, this.littleEndian);
    this.position += 4;
    return val;
  }
  public readDouble(): number {
    const val = this._stream.getFloat64(this.position, this.littleEndian);
    this.position += 8;
    return val;
  }
}
