const fs = require('fs');
const xlsx = require('xlsx');

// List all POIs
exports.list = (req, res) => {
  global.psql.select(
    'poi',
    'selectAll',
    {},
    (rows) => {
      res.json(global.funcCmmn.getReturnMessage({ resultData: rows, resultCnt: rows.length }));
    },
    (err) => {
      res.status(500).json(global.funcCmmn.getReturnMessage({ isErr: true, code: 500, message: err.message }));
    }
  );
};

// Import POIs from an uploaded Excel file
exports.importExcel = async (req, res) => {
  let filepath;
  try {
    if (!req.file) {
      return res.status(400).json(global.funcCmmn.getReturnMessage({ isErr: true, code: 400, message: 'No file uploaded' }));
    }

    // Use a single transaction for all DB changes
    const client = await global.psql.getConnection();
    const begin = async () => client.query('BEGIN');
    const commit = async () => client.query('COMMIT');
    const rollback = async () => client.query('ROLLBACK').catch(() => null);

    // Build SQL via mapper to run on the same client/transaction
    const sqlTrunc = global.psql.getStatement('poi', 'truncate', {});

    filepath = req.file.path;
    const workbook = xlsx.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: null });

    // Header normalization helper
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '_');

    // Build key map once from the first row
    const first = json[0] || {};
    const keyByNorm = {};
    for (const k of Object.keys(first)) keyByNorm[norm(k)] = k;

    // Collect valid items first
    const items = [];
    for (const row of json) {
      const name = row[keyByNorm.title];
      const lat = row[keyByNorm.latitude];
      const lon = row[keyByNorm.longitude];
      if (name == null || lat == null || lon == null) continue;
      const latitude = Number(lat);
      const longitude = Number(lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      items.push({ name, latitude, longitude });
    }

    // Execute within transaction
    let inserted = 0;
    await begin();
    try {
      // ensure table and truncate
      await client.query(sqlTrunc);

      // Bulk insert in chunks
      const CHUNK = 500;
      for (let i = 0; i < items.length; i += CHUNK) {
        const batch = items.slice(i, i + CHUNK);
        const sqlBulk = global.psql.getStatement('poi', 'insertPoiBulk', { list: batch });
        // eslint-disable-next-line no-await-in-loop
        const result = await client.query(sqlBulk);
        inserted += result && result.rowCount ? result.rowCount : 0;
      }

      await commit();
    } catch (txErr) {
      await rollback();
      throw txErr;
    } finally {
      try { client.release(); } catch (e) { void e; }
    }

    return res.json(global.funcCmmn.getReturnMessage({ message: 'Imported', resultCnt: inserted }));
  } catch (err) {
    return res.status(500).json(global.funcCmmn.getReturnMessage({ isErr: true, code: 500, message: err.message }));
  } finally {
    // Cleanup uploaded file when using disk storage
    try {
      if (typeof filepath === 'string' && filepath) fs.unlinkSync(filepath);
    } catch (e) { void e; }
  }
};
