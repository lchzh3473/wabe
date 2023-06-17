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
  public FMOD?: FMOD;
  public constructor() {
    this.ready = init(this);
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
          const audioData = obj.m_AudioData.getData();
          const fModule = new this.FMOD!();
          // eslint-disable-next-line no-await-in-loop
          await fModule.ready;
          const buf = audioData.slice().buffer;
          const t = {} as { val: unknown };
          const u = {} as { val: unknown };
          const exinfo = fModule.FMOD.CREATESOUNDEXINFO();
          exinfo.length = buf.byteLength;
          if (fModule.gSound) fModule.gSound.release();
          fModule.gSystem.createSound(buf, fModule.FMOD.OPENMEMORY, exinfo, t); let sound = t.val as FMOD_SOUND;
          // const b = {}; a.gSound.getSubSound(0, b), fModule.gSound = b.val;
          // const c = [{}, {}, {}, {}]; fModule.gSound.getFormat(...c);
          // const d = [{}, {}], a.gSound.getDefaults(...d);
          // const e = {}, a.gSound.getLength(e, fModule.FMOD.TIMEUNIT_PCMBYTES);
          // const f = [{}, {}, {}, {}]; fModule.gSound.lock(0, e.val, ...f);
          sound.getNumSubSounds(t); const numsubsounds = t.val as number;
          if (numsubsounds > 0) {
            sound.getSubSound(0, t); const subsound = t.val as FMOD_SOUND;
            sound = subsound;
          }
          sound.getFormat(null, null, t, u); const channels = t.val as number; const bits = u.val as number;
          sound.getDefaults(t, null); const frequency = t.val as number;
          const sampleRate = Math.floor(frequency);
          sound.getLength(t, fModule.FMOD.TIMEUNIT_PCMBYTES); const byteLength = t.val as number;
          console.log(channels, bits, sampleRate, frequency, byteLength);
          const playSound = (callback: (text: string) => void) => {
            fModule.gSystem.playSound(sound, null, false, t);
            const channel = t.val as FMOD_CHANNEL;
            console.log(channel);
            requestAnimationFrame(function loop() {
              channel.getPosition(t, fModule.FMOD.TIMEUNIT_MS);
              const position = t.val as number;
              sound.getLength(t, fModule.FMOD.TIMEUNIT_MS);
              const length = t.val as number;
              callback(`${position} / ${length}`);
              // channel.setVolume(0.5);
              // channel.setPaused(false);
              requestAnimationFrame(loop);
            });
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
async function init(module: App) {
  await initLZ4().then((instance: WebAssembly.Instance) => {
    // WebAssembly.instantiateStreaming(fetch('lz4-block-codec.wasm', { mode: 'same-origin' })).then(({ instance }) => {
    self.lz4api = instance.exports as typeof self.lz4api;
  });
  // eslint-disable-next-line @typescript-eslint/naming-convention
  await import('./fmod.js').then(({ FMOD }) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Object.assign(module, { FMOD });
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
interface FMOD {
  ready: Promise<void>;
  FMOD: {
    CREATESOUNDEXINFO: () => FMOD_CREATESOUNDEXINFO;
    OPENMEMORY: number;
    TIMEUNIT_PCMBYTES: number;
    TIMEUNIT_MS: number;
  };
  gSound: FMOD_SOUND | null;
  gSystem: FMOD_SYSTEM;
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (): FMOD;
}
interface FMOD_CREATESOUNDEXINFO {
  length: number;
}
interface FMOD_SOUND {
  release: () => void;
  getNumSubSounds: (outval: { val: unknown }) => void;
  getSubSound: (index: number, outval: { val: unknown }) => void;
  getFormat: (a: unknown, b: unknown, c: { val: unknown }, d: { val: unknown }) => void;
  getDefaults: (a: { val: unknown }, b: unknown) => void;
  getLength: (a: { val: unknown }, b: number) => void;
  lock: (a: number, b: number, c: number, d: number) => void;
}
interface FMOD_SYSTEM {
  createSound: (a: ArrayBuffer, b: number, c: FMOD_CREATESOUNDEXINFO, d: { val: unknown }) => void;
  playSound: (a: FMOD_SOUND, b: unknown, c: boolean, d: { val: unknown }) => void;
}
interface FMOD_CHANNEL {
  getPosition: (a: { val: unknown }, b: number) => void;
}
