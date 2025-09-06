const express = require('express');
const router = express.Router();
const https = require('https');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const poiController = require('../controllers/poiController');

// File upload (store in tmp folder). Be robust if globals are not yet set.
const rootDir = (global && global.ROOT) ? global.ROOT : path.join(__dirname, '..', '..');
const tmpDir = path.join(rootDir, 'tmp');
try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) { void e; }
const upload = multer({ dest: tmpDir });


/* GET home page. */
router.get('/', (req, res) => res.redirect('/index'));
router.get('/index', function(req, res) {
  res.render('index', { title: 'Express' });
});

// Proxy TMAP SDK to avoid appKey in page markup
router.get('/getScript', function(req, res) {
  const appKey = process.env.TMAP_API_KEY || '';
  const version = process.env.TMAP_VERSION || '';
  if (!appKey) {
    return res.status(500).send('TMAP API key not configured');
  }

  const url = `https://apis.openapi.sk.com/tmap/jsv2?version=${encodeURIComponent(version)}&appKey=${encodeURIComponent(appKey)}`;
  const u = new URL(url);
  const referer = req.headers.referer || `${req.protocol}://${req.get('host')}/`;
  const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const reqOut = https.request({
    hostname: u.hostname,
    path: u.pathname + u.search,
    method: 'GET',
    headers: {
      'Referer': referer,
      'Origin': origin,
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Accept': 'application/javascript, text/javascript, */*;q=0.1',
    }
  }, (r) => {
    if (r.statusCode !== 200) {
      console.warn('TMAP SDK fetch status:', r.statusCode, url);
      res.status(r.statusCode || 502);
    }
    r.pipe(res);
  });
  reqOut.on('error', (e) => {
    console.error('TMAP SDK fetch error:', e.message);
    res.status(502).send('Failed to load TMAP SDK');
  });
  reqOut.end();
});

router.post('/poi/import', upload.single('file'), poiController.importExcel);

module.exports = router;
