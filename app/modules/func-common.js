/**
 * 비동기 통신(AJAX)의 리턴 메시지 format
 * @param isErr: boolean
 * @param code: int
 * @param message: string
 * @param resultData: object
 * @param resultCnt: int
 * @returns {{resultYn: 'Y'|'N', statusCode: *, statusMessage: (*|string), errorCode: *, errorMessage: (*|string), resultData: (*|{}), resultCnt: *}}
 */
exports.getReturnMessage = ({ isErr = false, code = 200, message = '성공', resultData = null, resultCnt = 0 }) => {
  if (isErr) {
    return {
      statusCode: code,
      statusMessage: message,
      errorCode: code,
      errorMessage: message,
      resultData: resultData || {},
      resultCnt: resultCnt || 0,
    };
  }
  return {
    statusCode: code,
    statusMessage: message,
    errorCode: null,
    errorMessage: '',
    resultData,
    resultCnt,
  };
};

/**
 * snakeToCamel
 * @param json 변경할 json
 * @description json의 key를 snake case => camel case로 변환
 * @return json
 */
exports.snakeToCamel = (json) => {
  if (Array.isArray(json)) {
    for (const data of json) {
      // eslint-disable-next-line guard-for-in
      for (const key in data) {
        const oldVal = data[key];
        const newKey = key.replace(/_[a-z]/g, (letter) => letter.toUpperCase().replace('_', ''));
        if (newKey !== key) {
          delete data[key];
          data[newKey] = oldVal;
        }
      }
    }
  } else if (json && typeof json === 'object') {
    // eslint-disable-next-line guard-for-in
    for (const key in json) {
      const oldVal = json[key];
      const newKey = key.replace(/_[a-z]/g, (letter) => letter.toUpperCase().replace('_', ''));
      if (newKey !== key) {
        delete json[key];
        json[newKey] = oldVal;
      }
    }
  }
  return json;
};
