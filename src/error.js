const p = document.createElement('p');
p.style.color = 'red';
p.style.whiteSpace = 'pre-wrap';
document.body.append(p);
const getConstructorName = obj => {
  if (obj === null) return 'Null';
  if (obj === undefined) return 'Undefined';
  return obj.constructor.name;
};
  /** @param {Error} error */
const sysError = (error, message) => {
  const type = getConstructorName(error);
  // if (message == 'Script error.') return;
  let message2 = String(error);
  let detail = String(error);
  if (error instanceof Error) {
    const stack = error.stack || 'Stack not available';
    if (error.name === type) message2 = error.message;
    else message2 = `${error.name}: ${error.message}`;
    const idx = stack.indexOf(message2) + 1;
    if (idx) detail = `${message2}\n${stack.slice(idx + message2.length)}`;
    else detail = `${message2}\n    ${stack.split('\n').join('\n    ')}`; // Safari
  }
  if (message) message2 = message;
  const _errMessage = `[${type}] ${message2.split('\n')[0]}`;
  const errDetail = `[${type}] ${detail}`;
  p.innerHTML += `${errDetail.replace(/&/g, '&amp;').replace(/</g, '&lt;')}\n`;
};
self.addEventListener('error', e => sysError(e.error, e.message));
self.addEventListener('unhandledrejection', e => sysError(e.reason));
export default p;
