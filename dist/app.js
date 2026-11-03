const elements = Object.fromEntries(['temperature', 'humidity', 'condition', 'updated', 'status', 'refresh'].map(id => [id, document.getElementById(id)]));
const card = document.querySelector('.weather');
async function loadWeather() {
  if (elements.refresh.disabled) return;
  elements.refresh.disabled = true;
  card.setAttribute('aria-busy', 'true');
  elements.status.className = '';
  elements.status.textContent = '제주 날씨를 불러오고 있어요…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('/api/weather', { signal: controller.signal, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || '날씨 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
    const current = data.current;
    if (!current || !Number.isFinite(current.temp_c) || !Number.isFinite(current.humidity) || !current.condition?.text || !current.last_updated) throw new Error('날씨 데이터 형식이 올바르지 않아요. 다시 시도해주세요.');
    elements.temperature.textContent = current.temp_c;
    elements.humidity.textContent = current.humidity;
    elements.condition.textContent = current.condition.text;
    elements.updated.textContent = current.last_updated;
    elements.status.textContent = '제주시 기준 현재 날씨입니다.';
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
loadWeather();
