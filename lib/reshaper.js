var util = require('./util');

function traverseAndFind(data, searchType, hint) {
    var dataType = util.typeString(data);
    if (dataType === searchType) {
        return data;
    }
    switch(dataType) {
        case 'Object':
            return traverseObject(data, searchType, hint);
        default:
            // Object is not traversible
            return null;
    }
}

function traverseObject(object, searchType, hint) {
    var keys = Object.keys(object);
    var first = null;
    var hinted = null;
    for (var i = 0; i < keys.length; i++) {
        var data = object[keys[i]];
        if (util.typeString(data) === searchType) {
            first = data;
            if (hint === undefined) {
                break;
            }
            if (keys[i] === hint) {
                hinted = data;
            }
        }
    }
    // Not found? Traverse children.
    for (var i = 0; shouldKeepTraversing(first, hinted, hint) && i < keys.length; i++) {
        first = traverseAndFind(object[keys[i]], searchType, hint);
    }
    if (hinted !== null) {
        return hinted;
    }
    return first;
}

function shouldKeepTraversing(first, hinted, hint) {
    return first === null || (hint !== undefined && hinted === null);
}

function getExtractionFunction (schema) {
    var type = util.typeString(schema, true);
    switch (type) {
        case 'Array':
            return extractArray;
        case 'Number':
            return extractNumber;
        case 'String':
            return extractString;
        case 'Object':
            return extractObject;
        default:
            console.error('An extraction function is not defined for: ' + type);
    }
}

function extractObject(data, schema, hint) {
    var object = traverseAndFind(data, 'Object');
    var result = {};
    var keys = Object.keys(schema);
    keys.forEach(function (key) {
        var valueType = schema[key];
        var extractionFunction = getExtractionFunction(valueType);
        result[key] = extractionFunction(object, valueType, key);
    });
    return result;
}

function extractArray(data, schema, hint) {
    var array = traverseAndFind(data, 'Array');
    var arrayOf = schema[0];
    var result = [];
    var childExtractor = getExtractionFunction(arrayOf);
    array.forEach(function (item) {
        result.push(childExtractor(item, arrayOf, hint));
    });
    return result;
}

function extractNumber(data, schema, hint) {
    return traverseAndFind(data, 'Number', hint);
}

function extractString(data, schema, hint) {
    return traverseAndFind(data, 'String', hint);
}

function findShape (data, schema, hint) {
    return getExtractionFunction(schema)(data, schema, hint);
}

exports.findShape = findShape;
