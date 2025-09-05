const Pool = require('pg').Pool;
const pool = new Pool(CONFIG.db_server);
const fs = require('fs');

// mybatis mapper
const mapper = require('mybatis-mapper');

// create mapper
fs.readdir(path.join(ROOT, 'app', 'mapper'), (err, mapperList) => {
	for (var file of mapperList) {
		mapper.createMapper([path.join(ROOT, 'app', 'mapper', file)]);
	}
});

var format = {language: 'sql', indent: '  '};

// SQL 수행 전 로그
let preSqlLog = (sql) => {
	// console.log('------------------------	--------------------------------');
	// console.log(`✅  execute SQL :\n${sql}`);
};

// SQL 수행 후 로그
let postSqlLog = (count) => {
	if (count !== undefined) {
		 // console.log(`✅  result of SQL : ${count}건`);
	}
	 // console.log('--------------------------------------------------------');
};

/* Query : select multi rows (return : array) */
exports.select = (mapperName, queryId, param, onSuccess, onError) => {
	sql = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(sql);

	pool
		.query(sql)
		.then (result => {
			if (typeof onSuccess === 'function') {
				// SELECT SQL 여러 개일 경우 조회 결과가 배열로 RETURN 됨
				if (Array.isArray(result)) {
					for (this_result of result) {
						postSqlLog(this_result.rowCount);
						for (let data of this_result.rows) {
							data = funcCmmn.snakeToCamel(data);
						}
					}
					onSuccess(result);
				} else {
					postSqlLog(result.rowCount);
					onSuccess(result.rowCount ? funcCmmn.snakeToCamel(result.rows) : []);
				}
			} else {
				return;
			}
		}).catch (err => {
			postSqlLog();

			if (typeof onError === 'function') {
				onError(err);
			} else {
				return;
			}
		});
};

/* Query : select 1 row (return : json) */
exports.selectOne = (mapperName, queryId, param, onSuccess, onError) => {
	sql = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(sql);

	pool
		.query(sql)
		.then (result => {
			postSqlLog(result.rowCount);

			if (typeof onSuccess === 'function') {
				onSuccess(result.rowCount ? funcCmmn.snakeToCamel(result.rows[0]) : null);
			} else {
				return;
			}
		}).catch (err => {
			postSqlLog();

			if (typeof onError === 'function') {
				onError(err);
			} else {
				return;
			}
		});
};

/* Query : insert (return : inserted count of rows) */
exports.insert = (mapperName, queryId, param, onSuccess, onError) => {
	sql = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(sql);

	pool
		.query(sql)
		.then (result => {
			postSqlLog(result.rowCount);

			if (typeof onSuccess === 'function') {
				onSuccess(result.rowCount);
			} else {
				return;
			}
		}).catch (err => {
			postSqlLog();

			if (typeof onError === 'function') {
				onError(err);
			} else {
				return;
			}
		});
};

/* Query : insertReturn (return : inserted rows) */
exports.insertReturn = (mapperName, queryId, param, onSuccess, onError) => {
	sql = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(sql);

	pool
		.query(sql)
		.then (result => {
			postSqlLog(result.rowCount);

			if (typeof onSuccess === 'function') {
				onSuccess(funcCmmn.snakeToCamel(result.rows));
			} else {
				return;
			}
		}).catch (err => {
			postSqlLog();

			if (typeof onError === 'function') {
				onError(err);
			} else {
				return;
			}
		});
};

/* Query : update (return : updated count of rows) */
exports.update = (mapperName, queryId, param, onSuccess, onError) => {
	sql = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(sql);

	pool
		.query(sql)
		.then (result => {
			postSqlLog(result.rowCount);

			if (typeof onSuccess === 'function') {
				onSuccess(result.rowCount);
			} else {
				return;
			}
		}).catch (err => {
			postSqlLog();

			if (typeof onError === 'function') {
				onError(err);
			} else {
				return;
			}
		});
};

/* Query : updateReturn (return : updated rows) */
exports.updateReturn = (mapperName, queryId, param, onSuccess, onError) => {
	sql = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(sql);

	pool
		.query(sql)
		.then (result => {
			postSqlLog(result.rowCount);

			if (typeof onSuccess === 'function') {
				onSuccess(funcCmmn.snakeToCamel(result.rows));
			} else {
				return;
			}
		}).catch (err => {
			postSqlLog();

			if (typeof onError === 'function') {
				onError(err);
			} else {
				return;
			}
		});
};


/* Query : update (return : updated count of rows) */
exports.delete = (mapperName, queryId, param, onSuccess, onError) => {
    sql = mapper.getStatement(mapperName, queryId, param, format);
    preSqlLog(sql);

    pool
        .query(sql)
        .then (result => {
            postSqlLog(result.rowCount);

            if (typeof onSuccess === 'function') {
                onSuccess(result.rowCount);
            } else {
                return;
            }
        }).catch (err => {
        postSqlLog();

        if (typeof onError === 'function') {
            onError(err);
        } else {
            return;
        }
    });
};

exports.getConnection = () => {
	return pool.connect();
};

exports.getStatement = (mapperName, queryId, param) => {
	const statement = mapper.getStatement(mapperName, queryId, param, format);
	preSqlLog(statement);
	return statement;
};