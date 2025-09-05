let baseModel = require('./baseModel');

const INDEX = {
    id: null
    , name: null
};

exports.newModel = (opt) => {
    return baseModel.extend(INDEX, opt);
};