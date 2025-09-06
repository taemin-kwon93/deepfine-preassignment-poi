const baseModel = require('./baseModel');

const INDEX = {
  id: null,
  name: null,
};

exports.newModel = (opt) => baseModel.extend(INDEX, opt);
