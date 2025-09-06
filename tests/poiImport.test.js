/* eslint-env jest */

// Arrange
const request = require('supertest');

// Mock xlsx for deterministic rows
jest.mock('xlsx', () => {
  const rows = [
    { Title: 'A', Latitude: 37.1, Longitude: 127.1 },
    { Title: 'B', Latitude: 37.2, Longitude: 127.2 },
    { Title: 'C', Latitude: 37.3, Longitude: 127.3 },
  ];
  return {
    readFile: jest.fn(() => ({ SheetNames: ['S'], Sheets: { S: {} } })),
    utils: { sheet_to_json: jest.fn(() => rows) },
  };
});

// Mock DB boundary
const calls = { updates: [], inserts: [], queries: [] };
jest.mock('../app/modules/db.psql.js', () => {
  const control = { txFailAt: null, nonTxFailAt: null, txInsertCalls: 0, nonTxInsertCalls: 0 };
  return {
    __control: control,
    update: (mapper, id, param, ok) => { calls.updates.push({ mapper, id }); ok && ok(1); },
    insert: (mapper, id, param, ok, err) => {
      if (id === 'insertPoiBulk') {
        control.nonTxInsertCalls += 1;
        const n = Array.isArray(param?.list) ? param.list.length : 0;
        // record only successful inserts
        if (control.nonTxFailAt && control.nonTxInsertCalls >= control.nonTxFailAt) {
          return err && err(new Error('mock non-tx insert failure'));
        }
        calls.inserts.push({ n }); ok && ok(n);
      } else { ok && ok(1); }
    },
    getStatement: (mapper, id, param) => {
      const n = Array.isArray(param?.list) ? param.list.length : 0;
      return `${id}:${n}`;
    },
    getConnection: async () => ({
      query: async (sql) => {
        calls.queries.push(sql);
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rowCount: 0 };
        if (String(sql).startsWith('insertPoiBulk:')) {
          control.txInsertCalls += 1;
          if (control.txFailAt && control.txInsertCalls >= control.txFailAt) {
            throw new Error('mock tx insert failure');
          }
          const n = Number(String(sql).split(':')[1] || 0) || 0;
          return { rowCount: n };
        }
        return { rowCount: 0 };
      },
      release: () => {},
    }),
  };
});

// App under test
const dbMock = require('../app/modules/db.psql.js');
const app = require('../app');

// Helpers: avoid touching filesystem by attaching an in-memory Buffer
const fakeUpload = () => ({ buf: Buffer.from('x'), filename: 'poi.xlsx' });
const resetEnvAndCalls = () => {
  calls.updates.length = 0;
  calls.inserts.length = 0;
  calls.queries.length = 0;
  const c = require('../app/modules/db.psql.js').__control;
  c.txFailAt = null;
  c.nonTxFailAt = null;
  c.txInsertCalls = 0;
  c.nonTxInsertCalls = 0;
};

beforeEach(resetEnvAndCalls);

describe('POST /poi/import', () => {
  // Act + Assert
  test('400 when file is missing', async () => {
    await request(app).post('/poi/import').expect(400);
  });

  test('200 success with transaction by default', async () => {
    const { buf, filename } = fakeUpload();
    await request(app).post('/poi/import').attach('file', buf, filename).expect(200);
    // Assert: transactional flow
    expect(calls.queries).toEqual(expect.arrayContaining(['BEGIN', 'COMMIT']));
    expect(calls.queries).not.toEqual(expect.arrayContaining(['ROLLBACK']));
    // Assert: one bulk insert of 3 rows
    expect(calls.queries.some(s => String(s).startsWith('insertPoiBulk:3'))).toBe(true);
  });

  test('500 + rollback when transaction insert fails', async () => {
    dbMock.__control.txFailAt = 1; // fail on first tx insert
    const { buf, filename } = fakeUpload();
    await request(app).post('/poi/import').attach('file', buf, filename).expect(500);
    expect(calls.queries).toEqual(expect.arrayContaining(['BEGIN', 'ROLLBACK']));
    expect(calls.queries).not.toEqual(expect.arrayContaining(['COMMIT']));
  });
});
