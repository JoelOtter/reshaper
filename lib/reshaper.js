var util = require('./util');
var getExtractionFunction = require('./extract');

function reshaper(data, schema, hint) {
    var stacks = {
        data: [],
        staleKeys: [],
        goodKeys: []
    };
    var hintType = util.typeString(hint);
    var hints;
    if (hintType === 'Object' || hintType === 'Array') {
        hints = hint;
    } else if (hint == undefined) {
        hints = [];
    } else {
        hints = [hint];
    }
    return getExtractionFunction(schema)(data, schema, stacks, hints).value;
}

module.exports = reshaper;
