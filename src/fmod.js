/* eslint-disable no-negated-condition */
/* eslint-disable init-declarations */
/* eslint-disable no-undef */
/* eslint-disable new-cap */
export class FMOD {
  constructor({
    // preRun = () => prerun(this),
    onRuntimeInitialized = () => main(this)
    // INITIAL_MEMORY = 64 * 1024 * 1024
  } = {}) {
    this.FMOD = { onRuntimeInitialized };
    init(this).then(() => {
      this.gChannel = null;
      this.gDSP = null;
      this.gEffects = false;
      this.gSound = null;
      this.gSystem = null;
    });
    this._loadEndCallback = () => {};
    this.ready = new Promise(resolve => {
      this._loadEndCallback = resolve;
    });
  }
  readAsArrayBuffer(arrayBuffer) {
    // Create a sound that loops
    const chars = new Uint8Array(arrayBuffer);
    const outval = {};
    const exinfo = this.FMOD.CREATESOUNDEXINFO();
    exinfo.length = chars.length;
    if (this.gSound) this.gSound.release();
    const result = this.gSystem.createSound(chars.buffer, this.FMOD.LOOP_OFF | this.FMOD.OPENMEMORY, exinfo, outval);
    CHECK_RESULT(this, result);
    this.gSound = outval.val;
    // delete chars.buffer;
    // delete chars;
  }
  playSound() {
    const { FMOD: module } = this;
    if (this.gSound) {
      const outval = {};
      let result;
      result = this.gSystem.playSound(this.gSound, null, false, outval);
      CHECK_RESULT(this, result);
      this.gChannel = outval.val;
      result = this.gChannel.setCallback(channelCallback);
      CHECK_RESULT(this, result);
    }
    function channelCallback(channelcontrol, controltype, callbacktype, _commanddata1, _commanddata2) {
      if (callbacktype === module.CHANNELCONTROL_CALLBACK_END) {
        console.log('CALLBACK : Channel Ended');
        module.gChannel = null;
      }
      return module.OK;
    }
  }
}
async function init(module) {
  const script = document.createElement('script');
  await new Promise((resolve, reject) => {
    script.src = './fmod/fmodL.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  script.remove();
  FMODModule(module.FMOD);
}
function CHECK_RESULT(module, result) {
  if (result !== module.FMOD.OK) {
    const msg = `Error!!! '${module.FMOD.ErrorString(result)}'`;
    // alert(msg);
    throw msg;
  }
}
// (function() {
//   // Function called when user drags HTML range slider.
//   function volumeChanged(val) {
//     // document.querySelector('#volume_out').value = val;
//     if (gChannel) {
//       const result = gChannel.setVolume(parseFloat(val));
//       CHECK_RESULT(result);
//     }
//   }
//   // Function called when user presses HTML stop all sounds button.
//   function stopAll() {
//     const mcgout = {};
//     let result;
//     result = gSystem.getMasterChannelGroup(mcgout);
//     CHECK_RESULT(result);
//     const mcg = mcgout.val;
//     result = mcg.stop();
//     CHECK_RESULT(result);
//   }
//   // Function called when user presses HTML toggle effects button.
//   function toggleEffects() {
//     const channelGroupOut = {};
//     let channelGroup,
//       result;
//     result = gSystem.getMasterChannelGroup(channelGroupOut);
//     CHECK_RESULT(result);
//     channelGroup = channelGroupOut.val;
//     if (!gDSP) {
//       // Create the Reverb DSP
//       const dspOut = {};
//       result = gSystem.createDSPByType(FMOD.DSP_TYPE_SFXREVERB, dspOut);
//       CHECK_RESULT(result);
//       gDSP = dspOut.val;
//       // Adjust some parameters of the DSP
//       result = gDSP.setParameterFloat(FMOD.DSP_SFXREVERB_DECAYTIME, 5000.0);
//       result = gDSP.setParameterFloat(FMOD.DSP_SFXREVERB_WETLEVEL, -3.0);
//       result = gDSP.setParameterFloat(FMOD.DSP_SFXREVERB_DRYLEVEL, -2.0);
//       CHECK_RESULT(result);
//       // Add the DSP to the channel
//       result = channelGroup.addDSP(FMOD.CHANNELCONTROL_DSP_TAIL, gDSP);
//       CHECK_RESULT(result);
//       // document.querySelector('#effects_out').value = 'On';
//     } else {
//       result = channelGroup.removeDSP(gDSP);
//       CHECK_RESULT(result);
//       gDSP.release();
//       gDSP = null;
//       // document.querySelector('#effects_out').value = 'Off';
//     }
//   }
//   // Called from main, on an interval that updates at a regular rate (like in a game loop).
//   // Prints out information, about the system, and importantly calles System::udpate().
//   function updateApplication() {
//     const cpu = {};
//     let result;
//     result = gSystem.getCPUUsage(cpu);
//     CHECK_RESULT(result);
//     const channelsplaying = {};
//     result = gSystem.getChannelsPlaying(channelsplaying, null);
//     CHECK_RESULT(result);
//     // document.querySelector('#display_out').value = `Channels Playing = ${channelsplaying.val
//     // } : CPU = dsp ${cpu.dsp.toFixed(2)
//     // }% stream ${cpu.stream.toFixed(2)
//     // }% update ${cpu.update.toFixed(2)
//     // }% total ${(cpu.dsp + cpu.stream + cpu.update).toFixed(2)
//     // }%`;
//     const numbuffers = {};
//     const buffersize = {};
//     result = gSystem.getDSPBufferSize(buffersize, numbuffers);
//     CHECK_RESULT(result);
//     const rate = {};
//     result = gSystem.getSoftwareFormat(rate, null, null);
//     CHECK_RESULT(result);
//     const sysrate = {};
//     result = gSystem.getDriverInfo(0, null, null, sysrate, null, null);
//     CHECK_RESULT(result);
//     const ms = numbuffers.val * buffersize.val * 1000 / rate.val;
//     // document.querySelector('#display_out2').value = `Mixer rate = ${rate.val}hz : System rate = ${sysrate.val}hz : DSP buffer size = ${numbuffers.val} buffers of ${buffersize.val} samples (${ms.toFixed(2)} ms)`;
//     // Update FMOD
//     result = gSystem.update();
//     CHECK_RESULT(result);
//   }
// }());
// function prerun() {
//   /* No sounds to load! */
// }
// Called when the Emscripten runtime has initialized
function main(module) {
  const { FMOD: fModule } = module;
  // A temporary empty object to hold our system
  const systemOut = {};
  let result;
  console.log('Creating FMOD System object\n');
  // Create the system and check the result
  result = fModule.System_Create(systemOut);
  CHECK_RESULT(module, result);
  console.log('grabbing system object from temporary and storing it\n');
  // Take out our System object
  module.gSystem = systemOut.val;
  // Optional.  Setting DSP Buffer size can affect latency and stability.
  // Processing is currently done in the main thread so anything lower than 2048 samples can cause stuttering on some devices.
  console.log('set DSP Buffer size.\n');
  result = module.gSystem.setDSPBufferSize(2048, 2);
  CHECK_RESULT(module, result);
  console.log('initialize FMOD\n');
  // 1024 virtual channels
  result = module.gSystem.init(1024, fModule.CREATESAMPLE, null);
  CHECK_RESULT(module, result);
  console.log('initialize Application\n');
  // initApplication();
  // Starting up your typical JavaScript application loop. Set the framerate to 50 frames per second, or 20ms.
  console.log('Start game loop\n');
  // window.setInterval(updateApplication, 20);
  module._loadEndCallback();
  return fModule.OK;
}
self.makeWAV = function(pcmData = new ArrayBuffer(16), sampleRate = 44100, bits = 16, channels = 1) {
  const bytes = pcmData.byteLength;
  const data = new DataView(new ArrayBuffer(bytes + 44));
  data.setUint32(0, 0x52494646, false); // RIFF
  data.setUint32(4, bytes + 36, true); // size
  data.setUint32(8, 0x57415645, false); // WAVE
  data.setUint32(12, 0x666d7420, false); // fmt
  data.setUint32(16, 16, true); // 16bit
  data.setUint16(20, 1, true); // PCM
  data.setUint16(22, channels, true); // channels
  data.setUint32(24, sampleRate, true); // sampleRate
  data.setUint32(28, sampleRate * channels * bits / 8, true); // bytesPerSecond
  data.setUint16(32, channels * bits / 8, true); // blockAlign
  data.setUint16(34, bits, true); // bitsPerSample
  data.setUint32(36, 0x64617461, false); // data
  data.setUint32(40, bytes, true); // size
  new Uint8Array(data.buffer, 44).set(new Uint8Array(pcmData));
  return data.buffer;
};
self.playWAV = function(buffer) {
  const actx = new AudioContext();
  const source = actx.createBufferSource();
  actx.decodeAudioData(buffer, ab => {
    source.buffer = ab;
    source.connect(actx.destination);
    source.start();
  });
};
