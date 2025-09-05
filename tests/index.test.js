// No need to mock http if app.js avoids listening in test env

const request = require('supertest');
const app = require('../app');

// The /index route exists and is wired correctly.
// The rendered HTML includes a reference to /getScript (so the client can fetch your script).
test('GET /index → 200 and includes /getScript', async () => {
  const res = await request(app).get('/index').expect(200);
  expect(res.text).toContain('/getScript');
});
