// /* eslint-disable @typescript-eslint/naming-convention */
// import type { AudioClip } from './extract/classes/AudioClip';
// import { CREATESOUNDEXINFO, Factory, INITFLAGS, MODE, RESULT } from './fmod';
// export class AudioClipConverter {
//   private readonly m_AudioClip: AudioClip;
//   public constructor(audioClip: AudioClip) {
//     this.m_AudioClip = audioClip;
//   }
//   public ConvertToWav(): Uint8Array | null {
//     const m_AudioData = this.m_AudioClip.m_AudioData.getData();
//     if (m_AudioData == null || m_AudioData.length == 0) return null;
//     const exinfo = new CREATESOUNDEXINFO();
//     const system = new FMOD.System();
//     const sound = new FMOD.Sound();
//     let result = Factory.System_Create(system);
//     if (result !== RESULT.OK) return null;
//     result = system.init(1, INITFLAGS.NORMAL, IntPtr.Zero);
//     if (result !== RESULT.OK) return null;
//     exinfo.cbsize = Marshal.SizeOf(exinfo);
//     exinfo.length = m_AudioClip.m_Size;
//     result = system.createSound(m_AudioData, MODE.OPENMEMORY, exinfo, sound);
//     if (result !== RESULT.OK) return null;
//     result = sound.getNumSubSounds(FMOD.numsubsounds);
//     if (result !== RESULT.OK) return null;
//     let buff = null;
//     if (numsubsounds > 0) {
//       result = sound.getSubSound(0, FMOD.subsound);
//       if (result !== RESULT.OK) { return null }
//       buff = this.SoundToWav(subsound);
//       subsound.release();
//     } else {
//       buff = this.SoundToWav(sound);
//     }
//     sound.release();
//     system.release();
//     return buff;
//   }
//   // public byte[] SoundToWav(Sound sound)
//   // {
//   //     var result = sound.getFormat(out _, out _, out int channels, out int bits);
//   //     if (result != RESULT.OK)
//   //         return null;
//   //     result = sound.getDefaults(FMOD. frequency, out _);
//   //     if (result != RESULT.OK)
//   //         return null;
//   //     var sampleRate = (int)frequency;
//   //     result = sound.getLength(FMOD. length, TIMEUNIT.PCMBYTES);
//   //     if (result != RESULT.OK)
//   //         return null;
//   //     result = sound.@lock(0, length, FMOD. ptr1, FMOD. ptr2, FMOD. len1, FMOD. len2);
//   //     if (result != RESULT.OK)
//   //         return null;
//   //     byte[] buffer = new byte[len1 + 44];
//   //     //添加wav头
//   //     Encoding.UTF8.GetBytes("RIFF").CopyTo(buffer, 0);
//   //     BitConverter.GetBytes(len1 + 36).CopyTo(buffer, 4);
//   //     Encoding.UTF8.GetBytes("WAVEfmt ").CopyTo(buffer, 8);
//   //     BitConverter.GetBytes(16).CopyTo(buffer, 16);
//   //     BitConverter.GetBytes((short)1).CopyTo(buffer, 20);
//   //     BitConverter.GetBytes((short)channels).CopyTo(buffer, 22);
//   //     BitConverter.GetBytes(sampleRate).CopyTo(buffer, 24);
//   //     BitConverter.GetBytes(sampleRate * channels * bits / 8).CopyTo(buffer, 28);
//   //     BitConverter.GetBytes((short)(channels * bits / 8)).CopyTo(buffer, 32);
//   //     BitConverter.GetBytes((short)bits).CopyTo(buffer, 34);
//   //     Encoding.UTF8.GetBytes("data").CopyTo(buffer, 36);
//   //     BitConverter.GetBytes(len1).CopyTo(buffer, 40);
//   //     Marshal.Copy(ptr1, buffer, 44, (int)len1);
//   //     result = sound.unlock(ptr1, ptr2, len1, len2);
//   //     if (result != RESULT.OK)
//   //         return null;
//   //     return buffer;
//   // }
//   // public string GetExtensionName()
//   // {
//   //     if (m_AudioClip.version[0] < 5)
//   //     {
//   //         switch (m_AudioClip.m_Type)
//   //         {
//   //             case FMODSoundType.ACC:
//   //                 return ".m4a";
//   //             case FMODSoundType.AIFF:
//   //                 return ".aif";
//   //             case FMODSoundType.IT:
//   //                 return ".it";
//   //             case FMODSoundType.MOD:
//   //                 return ".mod";
//   //             case FMODSoundType.MPEG:
//   //                 return ".mp3";
//   //             case FMODSoundType.OGGVORBIS:
//   //                 return ".ogg";
//   //             case FMODSoundType.S3M:
//   //                 return ".s3m";
//   //             case FMODSoundType.WAV:
//   //                 return ".wav";
//   //             case FMODSoundType.XM:
//   //                 return ".xm";
//   //             case FMODSoundType.XMA:
//   //                 return ".wav";
//   //             case FMODSoundType.VAG:
//   //                 return ".vag";
//   //             case FMODSoundType.AUDIOQUEUE:
//   //                 return ".fsb";
//   //         }
//   //     }
//   //     else
//   //     {
//   //         switch (m_AudioClip.m_CompressionFormat)
//   //         {
//   //             case AudioCompressionFormat.PCM:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.Vorbis:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.ADPCM:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.MP3:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.PSMVAG:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.HEVAG:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.XMA:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.AAC:
//   //                 return ".m4a";
//   //             case AudioCompressionFormat.GCADPCM:
//   //                 return ".fsb";
//   //             case AudioCompressionFormat.ATRAC9:
//   //                 return ".fsb";
//   //         }
//   //     }
//   //     return ".AudioClip";
//   // }
//   // public bool IsSupport
//   // {
//   //     get
//   //     {
//   //         if (m_AudioClip.version[0] < 5)
//   //         {
//   //             switch (m_AudioClip.m_Type)
//   //             {
//   //                 case FMODSoundType.AIFF:
//   //                 case FMODSoundType.IT:
//   //                 case FMODSoundType.MOD:
//   //                 case FMODSoundType.S3M:
//   //                 case FMODSoundType.XM:
//   //                 case FMODSoundType.XMA:
//   //                 case FMODSoundType.AUDIOQUEUE:
//   //                     return true;
//   //                 default:
//   //                     return false;
//   //             }
//   //         }
//   //         else
//   //         {
//   //             switch (m_AudioClip.m_CompressionFormat)
//   //             {
//   //                 case AudioCompressionFormat.PCM:
//   //                 case AudioCompressionFormat.Vorbis:
//   //                 case AudioCompressionFormat.ADPCM:
//   //                 case AudioCompressionFormat.MP3:
//   //                 case AudioCompressionFormat.XMA:
//   //                     return true;
//   //                 default:
//   //                     return false;
//   //             }
//   //         }
//   //     }
//   // }
// }
export {};
