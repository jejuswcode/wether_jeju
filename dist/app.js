// 개인 로컬 사용 시 여기에 키를 넣을 수도 있습니다. 공유/배포 파일에는 키를 넣지 마세요.
const API_KEY = '';
const elements = Object.fromEntries(['temperature', 'humidity', 'condition', 'updated', 'status', 'refresh', 'settings', 'api-key', 'key-form'].map(id => [id, document.getElementById(id)]));
const card = document.querySelector('.weather');
let apiKey = API_KEY;
try { apiKey = API_KEY || sessionStorage.getItem('jeju-weather-key') || ''; } catch { /* 저장이 차단된 환경에서도 사용 가능 */ }
elements['api-key'].value = apiKey;

async function loadWeather() {
  if (!apiKey) {
    elements.settings.open = true;
    elements.status.textContent = 'API 키를 입력하면 제주 현재 날씨를 불러옵니다.';
    return;
  }
  elements.refresh.disabled = true;
  card.setAttribute('aria-busy', 'true');
  elements.status.className = '';
  elements.status.textContent = '제주 날씨를 불러오고 있어요…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const url = new URL('https://api.weatherapi.com/v1/current.json');
    url.search = new URLSearchParams({ key: apiKey, q: '33.4996,126.5312', lang: 'ko', aqi: 'no' });
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) {
      const code = data.error?.code;
      if ([1002, 2006, 2008].includes(code)) throw new Error('API 키가 올바른지 확인해주세요.');
      if (code === 2007) throw new Error('API 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.');
      throw new Error('날씨 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
    const current = data.current;
    if (!current || !Number.isFinite(current.temp_c) || !Number.isFinite(current.humidity) || !current.condition?.text || !current.last_updated) throw new Error('날씨 데이터 형식이 올바르지 않아요. 다시 시도해주세요.');
    elements.temperature.textContent = current.temp_c;
    elements.humidity.textContent = current.humidity;
    elements.condition.textContent = current.condition.text;
    elements.updated.textContent = current.last_updated;
    elements.status.textContent = '제주시 기준 현재 날씨입니다.';
    elements.settings.open = false;
  } catch (error) {
    elements.status.className = 'error';
    const message = error.name === 'AbortError' ? '요청 시간이 초과됐어요. 다시 시도해주세요.' : error instanceof TypeError ? '네트워크 연결을 확인하고 다시 시도해주세요.' : error.message;
    elements.status.textContent = message + (elements.temperature.textContent !== '—' ? ' 표시된 날씨는 이전에 받은 정보입니다.' : '');
  } finally {
    clearTimeout(timeout);
    elements.refresh.disabled = false;
    card.setAttribute('aria-busy', 'false');
  }
}
elements.refresh.addEventListener('click', loadWeather);
elements['key-form'].addEventListener('submit', event => {
  event.preventDefault();
  if (elements.refresh.disabled) return;
  apiKey = elements['api-key'].value.trim();
  try { sessionStorage.setItem('jeju-weather-key', apiKey); } catch { /* 세션 저장 없이 계속 */ }
  loadWeather();
});
loadWeather();
