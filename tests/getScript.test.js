// No need to mock http if app.js avoids listening in test env

// Mock https to avoid real network calls and capture options
jest.mock('https', () => {
  const { PassThrough } = require('stream');
  let status = 200;
  let body = '/*mock js*/';
  const calls = [];
  return {
    __calls: calls,
    __setResponse: (s, b) => { status = s; body = b; },
    request: (opts, cb) => {
      calls.push(opts);
      const res = new PassThrough();
      res.statusCode = status;
      process.nextTick(() => { cb(res); res.end(body); });
      return { on: jest.fn(), end: jest.fn() };
    },
  };
});

const request = require('supertest');
const httpsMock = require('https');
const app = require('../app');

beforeEach(() => {
  // reset env and https mock call log per test
  delete process.env.TMAP_API_KEY;
  delete process.env.TMAP_VERSION;
  if (httpsMock.__calls) httpsMock.__calls.length = 0;
  if (httpsMock.__setResponse) httpsMock.__setResponse(200, '/*mock js*/');
});

test('GET /getScript → 500 when no API key', async () => {
  delete process.env.TMAP_API_KEY;
  delete process.env.TMAP_VERSION;
  await request(app).get('/getScript').expect(500);
});

test('GET /getScript → 200 and proxies with expected headers', async () => {
  process.env.TMAP_API_KEY = 'abc123';
  process.env.TMAP_VERSION = '1';

  const res = await request(app)
    .get('/getScript')
    .set('Referer', 'http://localhost:3535/')
    .set('Origin', 'http://localhost:3535')
    .expect(200);

  expect(res.headers['content-type']).toMatch(/application\/javascript/);

  expect(httpsMock.__calls.length).toBe(1);
  const call = httpsMock.__calls[0];
  expect(call.hostname).toBe('apis.openapi.sk.com');
  expect(call.path).toMatch(/\/tmap\/jsv2\?version=1&appKey=abc123/);
  expect(call.headers.Referer).toBe('http://localhost:3535/');
  expect(call.headers.Origin).toBe('http://localhost:3535');
});

test('GET /getScript → propagates upstream non-200', async () => {
  process.env.TMAP_API_KEY = 'abc123';
  process.env.TMAP_VERSION = '1';
  httpsMock.__setResponse(401, 'unauthorized');

  await request(app).get('/getScript').expect(401);
});
