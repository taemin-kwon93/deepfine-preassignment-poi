/* eslint-env jest */

const request = require('supertest');

// Integration test that bypasses DB mocking to test the complete search flow
describe('POI Search Integration', () => {
  let app;

  beforeAll(() => {
    // Mock the database module with sample data
    jest.doMock('../app/modules/db.psql.js', () => {
      const sampleData = [
        { id: 1, name: 'Seoul Station', latitude: 37.5546, longitude: 126.9706 },
        { id: 2, name: 'Gangnam Station', latitude: 37.4979, longitude: 127.0276 },
        { id: 3, name: 'Coffee Bean Gangnam', latitude: 37.4990, longitude: 127.0297 },
        { id: 4, name: 'Starbucks Seoul', latitude: 37.5560, longitude: 126.9723 },
      ];

      return {
        select: (mapper, id, param, ok, err) => {
          try {
            if (id === 'selectAll') {
              return ok && ok(sampleData);
            }
            if (id === 'searchByName') {
              const query = param.query.toLowerCase();
              const filtered = sampleData.filter(poi => 
                poi.name.toLowerCase().includes(query)
              );
              return ok && ok(filtered);
            }
            return ok && ok([]);
          } catch (error) {
            return err && err(error);
          }
        },
      };
    });

    // Create fresh app instance
    delete require.cache[require.resolve('../app')];
    app = require('../app');
  });

  afterAll(() => {
    jest.unmock('../app/modules/db.psql.js');
  });

  describe('Search functionality', () => {
    test('can search for stations', async () => {
      const res = await request(app).get('/poi/search?q=station').expect(200);
      expect(res.body.resultData).toHaveLength(2);
      expect(res.body.resultData.map(p => p.name)).toEqual([
        'Seoul Station',
        'Gangnam Station'
      ]);
    });

    test('can search for coffee shops', async () => {
      const res = await request(app).get('/poi/search?q=coffee').expect(200);
      expect(res.body.resultData).toHaveLength(1);
      expect(res.body.resultData[0].name).toBe('Coffee Bean Gangnam');
    });

    test('case insensitive search', async () => {
      const res = await request(app).get('/poi/search?q=SEOUL').expect(200);
      expect(res.body.resultData).toHaveLength(2);
      expect(res.body.resultData.some(p => p.name === 'Seoul Station')).toBe(true);
      expect(res.body.resultData.some(p => p.name === 'Starbucks Seoul')).toBe(true);
    });

    test('partial matching works', async () => {
      const res = await request(app).get('/poi/search?q=gang').expect(200);
      expect(res.body.resultData).toHaveLength(2);
      expect(res.body.resultData.map(p => p.name)).toEqual([
        'Gangnam Station',
        'Coffee Bean Gangnam'
      ]);
    });

    test('returns correct coordinate data for map centering', async () => {
      const res = await request(app).get('/poi/search?q=Seoul Station').expect(200);
      expect(res.body.resultData).toHaveLength(1);
      const poi = res.body.resultData[0];
      expect(poi).toMatchObject({
        name: 'Seoul Station',
        latitude: 37.5546,
        longitude: 126.9706
      });
    });
  });
});