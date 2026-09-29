const form = document.querySelector('#short-form');
const input = document.querySelector('#long-url');
const submit = document.querySelector('#shorten');
const output = document.querySelector('#short-url');
const copy = document.querySelector('#copy');
const feedback = document.querySelector('#feedback');

function showFeedback(text, error = false) {
  feedback.textContent = text;
  feedback.classList.toggle('error', error);
}

function normalizeUrl(value) {
  const raw = value.trim();
  if (/\s/.test(raw) || (/^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw))) throw new TypeError();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol) || (!url.hostname.includes('.') && url.hostname !== 'localhost')) throw new TypeError();
  return url.href;
}

input.addEventListener('input', () => {
  submit.disabled = !input.value.trim();
  output.value = '';
  copy.disabled = true;
  showFeedback('URL을 입력하고 단축하기를 눌러 주세요.');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  let url;
  try {
    url = normalizeUrl(input.value);
  } catch {
    showFeedback('올바른 http 또는 https URL을 입력해 주세요.', true);
    return;
  }

  input.disabled = true;
  submit.disabled = true;
  submit.textContent = '단축 중...';
  showFeedback('짧은 주소를 만들고 있어요.');

  try {
    const response = await fetch('https://spoo.me/', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({ url }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('단축 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    const data = await response.json();
    if (!data.short_url) throw new Error('단축 서비스의 응답을 확인할 수 없어요.');
    const shortUrl = new URL(data.short_url);
    if (shortUrl.hostname !== 'spoo.me') throw new Error('단축 서비스의 응답을 확인할 수 없어요.');
    shortUrl.protocol = 'https:';

    output.value = shortUrl.href;
    copy.disabled = false;
    showFeedback('단축 완료! 복사 버튼을 눌러 공유해 보세요.');
  } catch (error) {
    const reason = error.name === 'TimeoutError' ? '응답 시간이 초과됐어요. 다시 시도해 주세요.'
      : error instanceof TypeError ? '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      : error instanceof SyntaxError ? '단축 서비스의 응답을 읽을 수 없어요. 잠시 후 다시 시도해 주세요.'
      : error.message;
    showFeedback(reason, true);
  } finally {
    input.disabled = false;
    submit.disabled = !input.value.trim();
    submit.innerHTML = '단축하기 <span aria-hidden="true">→</span>';
  }
});

copy.addEventListener('click', async () => {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    window.alert('복사하였습니다');
  } catch {
    showFeedback('자동 복사에 실패했어요. 출력 상자의 주소를 직접 복사해 주세요.', true);
  }
});
