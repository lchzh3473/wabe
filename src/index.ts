import { lastupdate, pubdate, version } from '../scripts/meta.json';
self._i = ['Unity资源提取器', version.split('.'), pubdate, lastupdate];
import App from './main';
import elem from './error.js';
const container = document.querySelector('.main')!;
container.appendChild(elem);
const app = new App();
app.callback = (type: string, obj: unknown) => {
  console.log(type, obj);
  if (type === 'TextAsset') {
    const textArea = document.createElement('textarea');
    textArea.value = obj as string;
    container.appendChild(textArea);
    textArea.style.cssText += ';width:80%;max-width:854px;min-height:100px;display:block;margin:0 auto';
    textArea.readOnly = true;
  }
  if (type === 'Texture2D') {
    const imageBitmap = obj as ImageBitmap;
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageBitmap, 0, 0);
    container.appendChild(canvas);
    canvas.style.cssText += ';width:80%;max-width:854px;min-height:100px;display:block;margin:0 auto;image-rendering:pixelated';
  }
  if (type === 'AudioClip') {
    const subContainer = obj as HTMLDivElement;
    container.appendChild(subContainer);
  }
};
app.ready.then(() => {
  const input = document.createElement('input');
  input.id = Utils.randomUUID();
  input.type = 'file';
  input.multiple = true;
  input.addEventListener('change', () => {
    for (const file of input.files!) {
      app.readFile(file);
    }
  });
  const label = document.createElement('label');
  label.htmlFor = input.id;
  label.textContent = 'Select files';
  container.appendChild(input);
  container.appendChild(label);
  const loadPreset = async(name: string) => {
    const buffer = await fetch(name).then(async res => res.arrayBuffer());
    app.readFile(new File([new Uint8Array(buffer)], name));
  };
  const loadPreset0 = document.createElement('button');
  loadPreset0.textContent = 'Preset1';
  loadPreset0.addEventListener('click', () => { loadPreset('d5fc9081b5932e732c44963e81ffbbaf.bundle') });
  loadPreset0.onclick = () => {
    loadPreset0.disabled = true;
    loadPreset0.classList.add('disabled');
  };
  container.appendChild(loadPreset0);
  const loadPreset1 = document.createElement('button');
  loadPreset1.textContent = 'Preset2';
  loadPreset1.addEventListener('click', () => { loadPreset('145804cf1860fde33237f838df1ad620.bundle') });
  loadPreset1.onclick = () => {
    loadPreset1.disabled = true;
    loadPreset1.classList.add('disabled');
  };
  container.appendChild(loadPreset1);
  const loadPreset2 = document.createElement('button');
  loadPreset2.textContent = 'Preset3';
  loadPreset2.addEventListener('click', () => { loadPreset('f0fb24ef80f2740b021fae4943938d5c.bundle') });
  loadPreset2.onclick = () => {
    loadPreset2.disabled = true;
    loadPreset2.classList.add('disabled');
  };
  container.appendChild(loadPreset2);
  // const buffer2 = await fetch('f0fb24ef80f2740b021fae4943938d5c.bundle').then(async res => res.arrayBuffer());
  // app.readFile(new File([new Uint8Array(buffer2)], 'f0fb24ef80f2740b021fae4943938d5c.bundle'));
});
