/* eslint-disable new-cap */
const FMOD = {};
const out = {};
const out2 = {};
const out3 = {};
const out4 = {};
let mSystem = null;
console.log('hello, fsb!');
const check = code => { if (code) throw new Error(`${FMOD.ErrorString(code)}(${code})`); };
const initSystem = async() => {
  if (!self.FMODModule) {
    importScripts('./fmod/fmod_reduced.js');
    self.FMODModule(FMOD);
    await FMOD.ready;
  }
  if (!mSystem) {
    check(FMOD.System_Create(out));
    mSystem = out.val;
    check(mSystem.setCallback(console.log, FMOD.SYSTEM_CALLBACK_ALL));
    check(mSystem.setOutput(FMOD.OUTPUTTYPE_NOSOUND_NRT));
    check(mSystem.init(1, FMOD.INIT_THREAD_UNSAFE, null));
  }
  return mSystem;
};
async function fsb2pcm(fsbBuffer, onprogress = n => n) {
  const system = await initSystem();
  const exinfo = FMOD.CREATESOUNDEXINFO();
  exinfo.length = fsbBuffer.byteLength;
  check(system.createSound(fsbBuffer, FMOD.OPENMEMORY | FMOD.OPENONLY, exinfo, out));
  const mSound = out.val;
  check(mSound.getNumSubSounds(out));
  const numsubsounds = out.val;
  let sound = null;
  if (numsubsounds > 0) {
    if (numsubsounds > 1) throw new Error('Not Supported');
    check(mSound.getSubSound(0, out));
    sound = out.val;
  } else {
    sound = mSound;
  }
  check(sound.getFormat(out, out2, out3, out4));
  const type = out.val;
  const format = out2.val;
  const channels = out3.val;
  const bits = out4.val;
  if (type !== 5 || format !== 5) throw new Error('Not Supported');
  check(sound.getDefaults(out, out2));
  const frequency = out.val;
  const _priority = out2.val;
  check(sound.getLength(out, FMOD.TIMEUNIT_PCMBYTES));
  const length = out.val;
  const pcmBuffer = new Uint8Array(length);
  const step = 262144;
  for (let i = 0; i < length; i += step) {
    console.log('progress', i, '/', length);
    onprogress(i / length);
    const size = Math.min(step, length - i);
    check(sound.readData(out, size, null));
    pcmBuffer.set(new Uint8Array(out.val), i);
  }
  onprogress(1);
  check(mSound.release());
  return {
    buffer: pcmBuffer.buffer,
    frequency,
    channels,
    bits
  };
}
async function readFSB(fsbBuffer) {
  const pcm = await fsb2pcm(fsbBuffer, progress => self.postMessage({ progress }));
  self.postMessage({ pcm });
  self.close();
}
self.addEventListener('message', msg => readFSB(msg.data));
