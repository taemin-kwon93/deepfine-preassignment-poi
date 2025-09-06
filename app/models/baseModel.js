const extend = require('extend');
const xss = require('xss');
// source : model
// target : JSON Data or Request Object
exports.extend = (source, target) => {
  const method = target.method;
  let arrParams = [];
  const rt = extend(true, {}, source);

  try {
    if (method === 'POST' || method === 'GET') {
      // binding from Route parameter
      for (const key of Object.getOwnPropertyNames(target.params)) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          rt[key] = xss(target.params[key]);
        }
      }

      // binding from POST/GET parameter
      arrParams = Object.getOwnPropertyNames(method === 'GET' ? target.query : target.body);

      for (const key of arrParams) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          rt[key] = (method === 'GET' ? xss(target.query[key]) : xss(target.body[key]));
        }
      }
    } else if (typeof JSON.parse(JSON.stringify(target)) === 'object') {
      // binding from JSON Data
      arrParams = Object.getOwnPropertyNames(target);

      for (const key of arrParams) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          rt[key] = xss(target[key]);
        }
      }
    }
  } catch (e) {
    // ignore binding errors
    void e;
  }

  return rt;
};


exports.extend_null = (source) => {
  const rt = extend(true, {}, source);
  return rt;
};

