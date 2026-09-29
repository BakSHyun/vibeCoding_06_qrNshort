const form = document.querySelector('#qr-form');
const input = document.querySelector('#url');
const message = document.querySelector('#message');
const workspace = document.querySelector('#workspace');
const result = document.querySelector('#result');
const qrContainer = document.querySelector('#qrcode');
const downloadButton = document.querySelector('#download');

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function normalizeUrl(value) {
  const raw = value.trim();
  if (!raw) throw new Error('URL을 입력해 주세요.');
  if (/\s/.test(raw) || (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw))) {
    throw new TypeError('올바른 URL을 입력해 주세요.');
  }
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol) || (!url.hostname.includes('.') && url.hostname !== 'localhost')) throw new TypeError('올바른 URL을 입력해 주세요.');
  return url.href;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    const url = normalizeUrl(input.value);
    if (typeof QRCode === 'undefined') throw new Error('QR 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');

    const nextCode = document.createElement('div');
    new QRCode(nextCode, {
      text: url,
      width: 256,
      height: 256,
      colorDark: '#242322',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    qrContainer.replaceChildren(...nextCode.childNodes);

    input.value = url;
    result.hidden = false;
    workspace.classList.add('has-result');
    showMessage('새 주소를 입력하면 QR 코드를 다시 만들 수 있어요.');
  } catch (error) {
    showMessage(error instanceof TypeError ? '올바른 URL을 입력해 주세요.' : (error.message?.includes('Code length overflow') ? '주소가 너무 길어 QR 코드에 담을 수 없어요.' : (error.message || 'QR 코드 생성 중 오류가 발생했습니다.')), true);
  }
});

downloadButton.addEventListener('click', () => {
  const source = qrContainer.querySelector('canvas');
  if (!source) return showMessage('QR 코드를 다시 생성해 주세요.', true);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1200;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 1200, 1200);
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 88, 88, 1024, 1024);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.download = 'url2qr.jpg';
  link.click();
  showMessage('JPG 파일이 다운로드됐어요.');
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let frame = 0;
  window.addEventListener('pointermove', (event) => {
    if (frame) return;
    const { clientX, clientY } = event;
    frame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--pointer-x', `${clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${clientY}px`);
      document.documentElement.style.setProperty('--cursor-hue', Math.round(30 + 300 * clientX / window.innerWidth));
      frame = 0;
    });
  }, { passive: true });
}
