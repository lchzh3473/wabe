import type { ObjectReader } from '../ObjectReader';
import { NamedObject } from '../UnityObject';
export abstract class Texture extends NamedObject {
  protected constructor(reader: ObjectReader) {
    super(reader);
    const { version } = reader;
    if (version[0] > 2017 || version[0] === 2017 && version[1] >= 3) { // 2017.3 and up
      /* const m_ForcedFallbackFormat = */ reader.readInt32();
      /* const m_DownscaleFallback = */ reader.readBoolean();
      if (version[0] > 2020 || version[0] === 2020 && version[1] >= 2) { // 2020.2 and up
        /* const m_IsAlphaChannelOptional = */ reader.readBoolean();
      }
      reader.alignStream();
    }
  }
}
