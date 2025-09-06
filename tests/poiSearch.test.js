/* eslint-env jest */

const request = require('supertest');

// Mock DB layer used by poiController.search
jest.mock('../app/modules/db.psql.js', () => {
  const control = {
    shouldError: false,
    searchResults: [
      { id: 1, name: 'Cafe A', latitude: 37.1, longitude: 127.1 },
      { id: 3, name: 'Cafe B', latitude: 37.3, longitude: 127.3 },
    ],
  };
  return {
    __control: control,
    select: (mapper, id, param, ok, err) => {
      if (control.shouldError) return err && err(new Error('mock search failure'));
      
      // Simulate search behavior
      if (id === 'searchByName') {
        const query = param.query.toLowerCase();
        const filtered = control.searchResults.filter(poi => 
          poi.name.toLowerCase().includes(query)
        );
        return ok && ok(filtered);
      }
      
      return ok && ok([]);
    },
  };
});

const dbMock = require('../app/modules/db.psql.js');
const app = require('../app');

describe('GET /poi/search', () => {
  beforeEach(() => {
    dbMock.__control.shouldError = false;
    dbMock.__control.searchResults = [
      { id: 1, name: 'Cafe A', latitude: 37.1, longitude: 127.1 },
      { id: 3, name: 'Cafe B', latitude: 37.3, longitude: 127.3 },
    ];
  });

  test('200 → returns matching POIs for search query', async () => {
    const res = await request(app).get('/poi/search?q=cafe').expect(200);
    expect(res.body).toHaveProperty('resultData');
    expect(Array.isArray(res.body.resultData)).toBe(true);
    expect(res.body.resultCnt).toBe(2);
    expect(res.body.resultData[0]).toMatchObject({ name: 'Cafe A' });
  });

  test('200 → returns partial matches', async () => {
    const res = await request(app).get('/poi/search?q=A').expect(200);
    expect(res.body.resultData).toHaveLength(2); // Both "Cafe A" and "Cafe B" contain "A"
    expect(res.body.resultData.some(poi => poi.name === 'Cafe A')).toBe(true);
  });

  test('200 → returns empty array for no matches', async () => {
    const res = await request(app).get('/poi/search?q=xyz').expect(200);
    expect(res.body.resultData).toHaveLength(0);
    expect(res.body.resultCnt).toBe(0);
  });

  test('200 → returns empty array for empty query', async () => {
    const res = await request(app).get('/poi/search?q=').expect(200);
    expect(res.body.resultData).toHaveLength(0);
    expect(res.body.resultCnt).toBe(0);
  });

  test('200 → returns empty array when no query parameter', async () => {
    const res = await request(app).get('/poi/search').expect(200);
    expect(res.body.resultData).toHaveLength(0);
    expect(res.body.resultCnt).toBe(0);
  });

  test('500 → handles DB error path', async () => {
    dbMock.__control.shouldError = true;
    const res = await request(app).get('/poi/search?q=cafe').expect(500);
    expect(res.body).toHaveProperty('errorCode', 500);
    expect(res.body).toHaveProperty('errorMessage');
    expect(String(res.body.errorMessage || '')).toMatch(/failure/i);
  });
});