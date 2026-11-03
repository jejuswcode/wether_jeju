export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { message: '지원하지 않는 요청입니다.' } });
  }
  const key = (process.env.WEATHER_API_KEY || process.env.WEATHERAPI_API_KEY || process.env.WEATHERAPI_KEY || '').trim();
  if (!key) return res.status(503).json({ error: { message: '날씨 서비스가 아직 설정되지 않았어요. 관리자에게 문의해주세요.' } });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const url = new URL('https://api.weatherapi.com/v1/current.json');
    url.search = new URLSearchParams({ key, q: '33.4996,126.5312', lang: 'ko', aqi: 'no' });
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.error) {
      // 외부 오류 내용이나 키를 브라우저에 전달하지 않습니다.
      const message = data.error?.code === 2007
        ? '날씨 서비스의 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.'
        : '날씨 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.';
      return res.status(502).json({ error: { message } });
    }
    const c = data.current;
    if (!c || !Number.isFinite(c.temp_c) || !Number.isFinite(c.humidity) || typeof c.condition?.text !== 'string' || typeof c.last_updated !== 'string') {
      return res.status(502).json({ error: { message: '날씨 데이터가 올바르지 않아요. 다시 시도해주세요.' } });
    }
    return res.status(200).json({ current: {
      temp_c: c.temp_c, humidity: c.humidity,
      condition: { text: c.condition.text }, last_updated: c.last_updated,
    } });
  } catch (error) {
    return res.status(error.name === 'AbortError' ? 504 : 502).json({ error: {
      message: error.name === 'AbortError' ? '날씨 요청 시간이 초과됐어요. 다시 시도해주세요.' : '날씨 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.',
    } });
  } finally {
    clearTimeout(timeout);
  }
}
