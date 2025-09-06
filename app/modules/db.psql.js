const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const mapper = require('mybatis-mapper');

// Pool: use globals populated by app.js
const pool = new Pool((global && global.CONFIG) ? global.CONFIG.db_server : {});

// Create mappers from app/mapper
try {
  const mapperDir = path.join(global.ROOT, 'app', 'mapper');
  const mapperList = fs.readdirSync(mapperDir);
  for (const file of mapperList) {
    mapper.createMapper([path.join(mapperDir, file)]);
  }
} catch (e) {
  // ignore missing mappers in test env
  void e;
}

const format = { language: 'sql', indent: '  ' };

const preSqlLog = (_sql) => {
  // console.log('------------------------\t--------------------------------');
  // console.log(`✅  execute SQL :\n${sql}`);
};

const postSqlLog = (count) => {
  if (count !== undefined) {
    // console.log(`✅  result of SQL : ${count}건`);
  }
  // console.log('--------------------------------------------------------');
};

exports.select = (mapperName, queryId, param, onSuccess, onError) => {
  const sql = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(sql);

  pool
    .query(sql)
    .then((result) => {
      if (typeof onSuccess === 'function') {
        if (Array.isArray(result)) {
          for (const r of result) {
            postSqlLog(r.rowCount);
            r.rows = r.rowCount ? r.rows.map((row) => global.funcCmmn.snakeToCamel(row)) : [];
          }
          onSuccess(result);
        } else {
          postSqlLog(result.rowCount);
          onSuccess(result.rowCount ? result.rows.map((row) => global.funcCmmn.snakeToCamel(row)) : []);
        }
      }
    })
    .catch((err) => {
      postSqlLog();
      if (typeof onError === 'function') onError(err);
    });
};

exports.selectOne = (mapperName, queryId, param, onSuccess, onError) => {
  const sql = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(sql);

  pool
    .query(sql)
    .then((result) => {
      postSqlLog(result.rowCount);
      if (typeof onSuccess === 'function') {
        onSuccess(result.rowCount ? global.funcCmmn.snakeToCamel(result.rows[0]) : null);
      }
    })
    .catch((err) => {
      postSqlLog();
      if (typeof onError === 'function') onError(err);
    });
};

exports.insert = (mapperName, queryId, param, onSuccess, onError) => {
  const sql = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(sql);

  pool
    .query(sql)
    .then((result) => {
      postSqlLog(result.rowCount);
      if (typeof onSuccess === 'function') onSuccess(result.rowCount);
    })
    .catch((err) => {
      postSqlLog();
      if (typeof onError === 'function') onError(err);
    });
};

exports.insertReturn = (mapperName, queryId, param, onSuccess, onError) => {
  const sql = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(sql);

  pool
    .query(sql)
    .then((result) => {
      postSqlLog(result.rowCount);
      if (typeof onSuccess === 'function') onSuccess(global.funcCmmn.snakeToCamel(result.rows));
    })
    .catch((err) => {
      postSqlLog();
      if (typeof onError === 'function') onError(err);
    });
};

exports.update = (mapperName, queryId, param, onSuccess, onError) => {
  const sql = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(sql);

  pool
    .query(sql)
    .then((result) => {
      postSqlLog(result.rowCount);
      if (typeof onSuccess === 'function') onSuccess(result.rowCount);
    })
    .catch((err) => {
      postSqlLog();
      if (typeof onError === 'function') onError(err);
    });
};

exports.delete = (mapperName, queryId, param, onSuccess, onError) => {
  const sql = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(sql);

  pool
    .query(sql)
    .then((result) => {
      postSqlLog(result.rowCount);
      if (typeof onSuccess === 'function') onSuccess(result.rowCount);
    })
    .catch((err) => {
      postSqlLog();
      if (typeof onError === 'function') onError(err);
    });
};

exports.getConnection = () => pool.connect();

exports.getStatement = (mapperName, queryId, param) => {
  const statement = mapper.getStatement(mapperName, queryId, param, format);
  preSqlLog(statement);
  return statement;
};
