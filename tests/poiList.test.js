/* eslint-env jest */

const request = require('supertest');

// Mock DB layer used by poiController.list
jest.mock('../app/modules/db.psql.js', () => {
  const control = {
    shouldError: false,
    rows: [
      { id: 1, name: 'Cafe A', latitude: 37.1, longitude: 127.1 },
      { id: 2, name: 'Park B', latitude: 37.2, longitude: 127.2 },
    ],
  };
  return {
    __control: control,
    select: (_mapper, _id, _param, ok, err) => {
      if (control.shouldError) return err && err(new Error('mock select failure'));
      return ok && ok(control.rows);
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

  test('500 → handles DB error path', async () => {
    dbMock.__control.shouldError = true;
    const res = await request(app).get('/poi').expect(500);
    expect(res.body).toHaveProperty('errorCode', 500);
    expect(res.body).toHaveProperty('errorMessage');
    expect(String(res.body.errorMessage || '')).toMatch(/failure/i);
  });
});
