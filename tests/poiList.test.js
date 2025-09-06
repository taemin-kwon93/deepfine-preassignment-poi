/* eslint-env jest */

const request = require('supertest');

// Mock DB layer used by poiController.list
jest.mock('../app/modules/db.psql.js', () => {
  const control = {
    shouldError: false,
    rows: [
      { id: 1, name: 'Cafe A', latitude: 37.1, longitude: 127.1 },
      { id: 2, name: 'Park B', latitude: 37.2, longitude: 127.2 },
      { id: 3, name: 'Cafe Alpha', latitude: 37.3, longitude: 127.3 },
    ],
    lastParam: null,
  };
  return {
    __control: control,
    select: (_mapper, _id, param, ok, err) => {
      control.lastParam = param;
      if (control.shouldError) return err && err(new Error('mock select failure'));
      let out = control.rows.slice();
      if (param && param.q) {
        const q = String(param.q).toLowerCase();
        out = out.filter(r => String(r.name || '').toLowerCase().includes(q));
      }
      // no coordinate-based filtering in current scope
      if (param && param.limit != null) out = out.slice(0, param.limit);
      return ok && ok(out);
    },
  };
});

const dbMock = require('../app/modules/db.psql.js');
const app = require('../app');

describe('GET /poi', () => {
  beforeEach(() => {
    dbMock.__control.shouldError = false;
    dbMock.__control.rows = [
      { id: 1, name: 'Cafe A', latitude: 37.1, longitude: 127.1 },
      { id: 2, name: 'Park B', latitude: 37.2, longitude: 127.2 },
    ];
  });

  test('200 → returns wrapped list and count', async () => {
    const res = await request(app).get('/poi').expect(200);
    expect(res.body).toHaveProperty('resultData');
    expect(Array.isArray(res.body.resultData)).toBe(true);
    expect(res.body.resultCnt).toBe(2);
    // basic field check
    expect(res.body.resultData[0]).toMatchObject({ name: 'Cafe A', latitude: 37.1, longitude: 127.1 });
  });

  test('200 → filters by q and limit', async () => {
    const res = await request(app).get('/poi?q=cafe&limit=1').expect(200);
    expect(res.body.resultCnt).toBe(1);
    expect(res.body.resultData[0].name.toLowerCase()).toContain('cafe');
  });

  test('500 → handles DB error path', async () => {
    dbMock.__control.shouldError = true;
    const res = await request(app).get('/poi').expect(500);
    expect(res.body).toHaveProperty('errorCode', 500);
    expect(res.body).toHaveProperty('errorMessage');
    expect(String(res.body.errorMessage || '')).toMatch(/failure/i);
  });
});
