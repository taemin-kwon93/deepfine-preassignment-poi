let extend = require('extend');
let xss = require('xss')
// source : model
// target : JSON Data or Request Object
exports.extend = (source, target) => {
    let method = target.method;
    let arrParams = [];
    let rt = extend(true, {}, source);

    try {

        if (method === 'POST' || method === 'GET') {
            // binding from Route parameter
            for (let key of Object.getOwnPropertyNames(target.params)) {
                if (source.hasOwnProperty(key)) {
                    rt[key] = xss(target.params[key]);
                }
            }

            // binding from POST/GET parameter
            arrParams = Object.getOwnPropertyNames(method === 'GET' ? target.query : target.body);

            for (let key of arrParams) {
                if (source.hasOwnProperty(key)) {
                    rt[key] = (method === 'GET' ? xss(target.query[key]) : xss(target.body[key]));
                }
            }
        } else if (typeof JSON.parse(JSON.stringify(target)) === 'object') {
            // binding from JSON Data
            arrParams = Object.getOwnPropertyNames(target);

            for (let key of arrParams) {
                if (source.hasOwnProperty(key)) {
                    rt[key] = xss(target[key]);
                }
            }
        }
    } catch (e) {
        target = undefined;
    }

    return rt;
};


exports.extend_null = (source,) => {
    let rt = extend(true, {}, source);
    return rt;
};

