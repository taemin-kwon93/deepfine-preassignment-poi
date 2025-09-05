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
			statusCode: code
			, statusMessage: message
			, errorCode: code
			, errorMessage: message
			, resultData: resultData || {}
			, resultCnt: resultCnt || 0
		}
	} else {
		return {
			 statusCode: code
			, statusMessage: message
			, errorCode: null
			, errorMessage: ''
			, resultData
			, resultCnt
		}
	}
};

/**
 * snakeToCamel
 * @param json 변경할 json
 * @description json의 key를 snake case => camel case로 변환
 * @return json
 */
exports.snakeToCamel = (json) => {

	if (Array.isArray(json)) {
		for (let data of json) {
			for(let key in data) {
				const oldKey = data[key];
				const newKey = key.replace(/_[a-z]/g, letter => letter.toUpperCase().replace("_", ""));

				delete data[key];
				data[newKey] = oldKey;
			}
		}
	} else {
		for(let key in json) {
			const oldKey = json[key];
			const newKey = key.replace(/_[a-z]/g, letter => letter.toUpperCase().replace("_", ""));

			delete json[key];
			json[newKey] = oldKey;
		}
	}

	return json;
};
