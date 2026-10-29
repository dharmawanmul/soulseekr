import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLiveWeatherData } from '../js/weather-chaser.js';
import { getTimeRangeLabel } from '../js/card-renderer.js';

const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
afterEach(() => {
  if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
  else delete globalThis.navigator;
});
function navigatorWith(geolocation) {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation } });
}
const position = { coords: { latitude: -6.2, longitude: 106.8 } };
const weather = { current: { temperature_2m: 27, apparent_temperature: 28,
  relative_humidity_2m: 70, surface_pressure: 1010, wind_speed_10m: 8, precipitation: 0, weather_code: 0 },
  hourly: { temperature_2m: [27], relative_humidity_2m: [70], precipitation_probability: [0] } };

test('location denial returns a recoverable result without making a weather request', async t => {
  navigatorWith({ getCurrentPosition(_success, fail) { fail(); } });
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; });
  assert.equal((await fetchLiveWeatherData()).available, false);
  assert.equal(requests, 0);
});

test('a new attempt after denied permission fetches real supplied weather fields', async t => {
  navigatorWith({ getCurrentPosition(success) { success(position); } });
  t.mock.method(globalThis, 'fetch', async url => {
    assert.match(String(url), /latitude=-6.2000/);
    return new Response(JSON.stringify(weather));
  });
  const result = await fetchLiveWeatherData();
  assert.equal(result.available, true);
  assert.equal(result.temp, 27);
  assert.equal(result.humidity, 70);
});

test('a stalled weather request finishes with timeout recovery feedback', async t => {
  navigatorWith({ getCurrentPosition(success) { success(position); } });
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Aborted')));
  }));
  const result = await fetchLiveWeatherData({ timeoutMs: 20 });
  assert.equal(result.available, false);
  assert.match(result.reason, /timed out/);
});

test('the long-term artifact label describes a year, not all-time history', () => {
  assert.equal(getTimeRangeLabel('long_term'), 'ABOUT 1 YEAR');
});

test('a malformed weather response does not invent default conditions', async t => {
  navigatorWith({ getCurrentPosition(success) { success(position); } });
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('{}'));
  assert.equal((await fetchLiveWeatherData()).available, false);
});
