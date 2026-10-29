export async function requestJson(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(error => {
      if (response.ok || controller.signal.aborted) throw error;
      return {};
    });
    return { response, data };
  } catch (error) {
    if (controller.signal.aborted) {
      const timeout = new Error('The request timed out. Check your connection and try again.', { cause: error });
      timeout.code = 'REQUEST_TIMEOUT';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function retryAfterMs(value, now = Date.now()) {
  if (value !== null && String(value).trim() !== '' && Number.isFinite(Number(value))) {
    return Math.max(1000, Number(value) * 1000);
  }
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(1000, date - now) : 30000;
}
