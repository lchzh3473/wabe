export default function decodeBlockLZ4(blockInfoBytes: Uint8Array, uncompressedSize: number): Uint8Array {
  if (!self.lz4api) { throw new Error('lz4api not loaded') }
  const { lz4api } = self;
  const inputSize = blockInfoBytes.length;
  const mem0 = lz4api.getLinearMemoryOffset();
  const memSize = inputSize + uncompressedSize;
  const neededByteLength = lz4api.getLinearMemoryOffset() + memSize;
  const pageCountBefore = lz4api.memory.buffer.byteLength >>> 16;
  const pageCountAfter = neededByteLength + 65535 >>> 16;
  if (pageCountAfter > pageCountBefore) lz4api.memory.grow(pageCountAfter - pageCountBefore);
  const memBuffer = lz4api.memory.buffer;
  const inputArea = new Uint8Array(memBuffer, mem0, inputSize);
  inputArea.set(blockInfoBytes);
  const outputSize = lz4api.lz4BlockDecode(mem0, inputSize, mem0 + inputSize);
  if (outputSize === 0) throw new Error('lz4 decompression error: size not correct');
  return new Uint8Array(memBuffer.slice(mem0 + inputSize, mem0 + inputSize + outputSize));
}
