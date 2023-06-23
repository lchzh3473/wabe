/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/naming-convention */
import { AssetsManager, TextAsset } from './extract';
import { AudioClip } from './extract/classes/AudioClip';
import { Texture2D, TextureFormat } from './extract/classes/Texture2D';
// @ts-expect-error: vite-plugin-wasm
import initLZ4 from './lz4/lz4-block-codec.wasm?init';
if (DataView.prototype.getBigUint64 === undefined) {
  // eslint-disable-next-line no-extend-native
  DataView.prototype.getBigUint64 = function(offset: number, littleEndian?: boolean) {
    const left = this.getUint32(offset, littleEndian);
    const right = this.getUint32(offset + 4, littleEndian);
    const combined = littleEndian! ? right * 2 ** 32 + left : left * 2 ** 32 + right;
    return combined as unknown as bigint;
  };
}
if (DataView.prototype.getBigInt64 === undefined) {
  // eslint-disable-next-line no-extend-native
  DataView.prototype.getBigInt64 = function(offset: number, littleEndian?: boolean) {
    const uint64 = this.getBigUint64(offset, littleEndian) as unknown as number;
    const int64 = uint64 > 2 ** 63 - 1 ? uint64 - 2 ** 64 : uint64;
    return int64 as unknown as bigint;
    // const left = this._stream.getInt32(offset, littleEndian);
    // const right = this._stream.getUint32(offset + 4, littleEndian);
    // const combined = littleEndian! ? right * 2 ** 32 + left : left * 2 ** 32 + right;
    // return combined as unknown as bigint;
  };
}
if (self.createImageBitmap === undefined) {
  // @ts-expect-error: implementation
  self.createImageBitmap = async function(imageData: ImageData, options?: ImageBitmapOptions) {
    return new Promise<ImageBitmap>(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      if (options?.imageOrientation === 'flipY') {
        ctx.setTransform(1, 0, 0, -1, 0, imageData.height);
        ctx.drawImage(canvas, 0, 0);
        ctx.resetTransform();
      }
      resolve(canvas as unknown as ImageBitmap);
    });
  };
}
export default class App {
  public ready: Promise<void>;
  // public lz4api!: typeof self.lz4api;
  public callback: (type: string, obj: unknown) => void;
  public constructor() {
    this.ready = init();
    this.callback = () => {};
  }
  public async readFile(file: File): Promise<void> {
    const manager = new AssetsManager();
    console.log(manager);
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    await new Promise<void>(resolve => {
      reader.onload = () => {
        manager.loadFile(new Uint8Array(reader.result as ArrayBuffer), file.name);
        resolve();
      };
    });
    // manager.loadFile(new Uint8Array(await file.arrayBuffer()), file.name);
    manager.readAssets();
    for (const assetsFile of manager.assetsFileList) {
      for (const obj of assetsFile.objects) {
        if (obj instanceof TextAsset) {
          // let numOfNotes = 0;
          // JSON.parse(new TextDecoder().decode(obj.m_Script), (key, value: { length: number }) => {
          //   if (key === 'notesAbove') numOfNotes += value.length;
          //   if (key === 'notesBelow') numOfNotes += value.length;
          //   return value;
          // });
          // console.log(numOfNotes);
          // console.log(obj.assetsFile.originalPath);
          // console.log('TextAsset', obj);
          this.callback('TextAsset', new TextDecoder().decode(obj.m_Script));
        } else if (obj instanceof Texture2D) {
          const imageData = getImage(obj);
          // eslint-disable-next-line no-await-in-loop
          const imageBitmap = await createImageBitmap(imageData, { imageOrientation: 'flipY' });
          // const canvas = document.createElement('canvas');
          // canvas.width = imageData.width;
          // canvas.height = imageData.height;
          // const ctx = canvas.getContext('2d')!;
          // ctx.putImageData(imageData, 0, 0);
          // ctx.drawImage(imageBitmap, 0, 0);
          // console.log(obj.assetsFile.originalPath);
          // console.log('Texture2D', obj);
          this.callback('Texture2D', imageBitmap);
        } else if (obj instanceof AudioClip) {
          const playSound = async(callback: (text: string) => void) => {
            const audioData = obj.m_AudioData.getData();
            const pcm = await new Promise<{ buffer: Float32Array; frequency: number; channels: number }>(resolve => {
              const worker = new Worker('./fmod.worker.js');
              worker.postMessage(audioData, [audioData.buffer]);
              worker.onmessage = ({ data }) => {
                if (data.progress != null) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  callback(data.progress);
                } else if (data.pcm != null) {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  resolve(data.pcm);
                }
              };
            });
            // const pcm = await fsb2pcm(audioData, callback);
            const actx = new AudioContext();
            playFloat32PCM(actx, pcm.buffer, pcm.frequency, pcm.channels);
          };
          // console.log(obj.assetsFile.originalPath);
          // console.log('AudioClip', obj);
          // console.log(obj.m_AudioData.getData());
          this.callback('AudioClip', playSound);
        } else {
          // console.log(obj);
          this.callback('Unknown', obj);
        }
      }
    }
  }
}
async function init() {
  await initLZ4().then((instance: WebAssembly.Instance) => {
    // WebAssembly.instantiateStreaming(fetch('lz4-block-codec.wasm', { mode: 'same-origin' })).then(({ instance }) => {
    self.lz4api = instance.exports as typeof self.lz4api;
  });
  console.log('Hello, world!');
}
// const buffer0 = await fetch('d5fc9081b5932e732c44963e81ffbbaf.bundle').then(async res => res.arrayBuffer());
// const buffer1 = await fetch('145804cf1860fde33237f838df1ad620.bundle').then(async res => res.arrayBuffer());
// const buffer2 = await fetch('f0fb24ef80f2740b021fae4943938d5c.bundle').then(async res => res.arrayBuffer());
// const manager = new AssetsManager();
// manager.loadFile(new Uint8Array(buffer0), 'd5fc9081b5932e732c44963e81ffbbaf.bundle');
// manager.loadFile(new Uint8Array(buffer1), '145804cf1860fde33237f838df1ad620.bundle');
// manager.loadFile(new Uint8Array(buffer2), 'f0fb24ef80f2740b021fae4943938d5c.bundle');
// console.log(manager);
function getImage(obj: Texture2D): ImageData {
  const rawData = obj.imageData!.getData();
  switch (obj.m_TextureFormat) {
    case TextureFormat.RGB24: {
      const imageData = new Uint8ClampedArray(obj.m_Width * obj.m_Height * 4);
      for (let i = 0; i < rawData.length / 3; i++) {
        imageData[i * 4] = rawData[i * 3];
        imageData[i * 4 + 1] = rawData[i * 3 + 1];
        imageData[i * 4 + 2] = rawData[i * 3 + 2];
        imageData[i * 4 + 3] = 255;
      }
      return new ImageData(imageData, obj.m_Width, obj.m_Height);
    }
    case TextureFormat.RGBA32: {
      try {
        return new ImageData(new Uint8ClampedArray(rawData), obj.m_Width, obj.m_Height);
      } catch (e) {
        console.warn(e, obj);
        const imageData = new Uint8ClampedArray(obj.m_Width * obj.m_Height * 4 || 4);
        imageData.set(rawData.subarray(0, obj.m_Width * obj.m_Height * 4 || 4));
        return new ImageData(imageData, obj.m_Width || 1, obj.m_Height || 1);
      }
    }
    case TextureFormat.Alpha8: {
      const imageData = new Uint8ClampedArray(obj.m_Width * obj.m_Height * 4);
      for (let i = 0; i < rawData.length; i++) {
        imageData[i * 4] = 0;
        imageData[i * 4 + 1] = 0;
        imageData[i * 4 + 2] = 0;
        imageData[i * 4 + 3] = rawData[i];
      }
      return new ImageData(imageData, obj.m_Width, obj.m_Height);
    }
    default:
      // throw new Error(`Unsupported texture format ${TextureFormat[obj.m_TextureFormat]}`);
      console.warn(`Unsupported texture format ${TextureFormat[obj.m_TextureFormat]}`);
      return new ImageData(new Uint8ClampedArray(obj.m_Width * obj.m_Height * 4), obj.m_Width, obj.m_Height);
  }
}
function readPCMFloat(actx: AudioContext, pcmData = new ArrayBuffer(32), sampleRate = 44100, channels = 2) {
  const data = new Float32Array(pcmData);
  const length = data.length / channels;
  const buffer = actx.createBuffer(channels, length, sampleRate);
  for (let i = 0; i < channels; i++) {
    const channelData = buffer.getChannelData(i);
    for (let j = 0; j < length; j++) {
      channelData[j] = data[j * channels + i];
    }
  }
  return buffer;
}
function playFloat32PCM(actx: AudioContext, pcmData = new ArrayBuffer(32), sampleRate = 44100, channels = 2) {
  const source = actx.createBufferSource();
  const buffer = readPCMFloat(actx, pcmData, sampleRate, channels);
  source.buffer = buffer;
  source.connect(actx.destination);
  source.start();
}
