var util = require('./util');

var dataStack; // TODO currently, this never pops

function traverseAndFind(data, searchType, hint, getFirst) {
    var dataType = util.typeString(data);
    if (dataType === searchType && getFirst !== false) {
        // We don't want to do this if we're explicitly only looking
        // for hints. 'Explicit' here means getFirst is false, rather
        // than simply undefined.
        return data;
    }
    var getFirst = hint === undefined || getFirst;
    switch(dataType) {
        case 'Object':
            return traverseObject(data, searchType, hint, getFirst);
        default:
            // Data is not traversible
            return null;
    }
}

function traverseObject(object, searchType, hint, getFirst) {
    var keys = Object.keys(object);
    // Breadth-first. Let's first look over the members of the object.
    for (var i = 0; i < keys.length; i++) {
        var data = object[keys[i]];
        if (util.typeString(data) === searchType) {
            if (getFirst || keys[i] === hint) {
                // First match of correct type, or matches hint - return.
                return data;
            }
        }
    }
    // If we get to here, we haven't found anything yet. Let's search the children.
    for (var i = 0; i < keys.length; i++) {
        var hinted = traverseAndFind(object[keys[i]], searchType, hint, false);
        if (hinted !== null) {
            return hinted;
        }
    }
    // No hints found anywhere. If we were only looking for these, stop now.
    if (getFirst === false) {
        return null;
    }
    // If we're OK to just return the first type match, let's do that.
    for (var i = 0; i < keys.length; i++) {
        var first = traverseAndFind(object[keys[i]], searchType, hint, true);
        if (first !== null) {
            return first;
        }
    }
    // We found nothing.
    return null;
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
    dataStack.push(data);
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
    var arrayOf = schema[0];
    var array = traverseAndFind(data, 'Array');
    // Can't find? Might have gone too deep - use stack.
    if (array === null && dataStack.length > 0) {
        array = traverseAndFind(dataStack[dataStack.length-1], 'Array');
    }
    // Still nothing? OK. Let's make an array out of object keys.
    if (array === null) {
        array = objectToArray(data, arrayOf, hint);
    }
    var result = [];
    var childExtractor = getExtractionFunction(arrayOf);
    array.forEach(function (item) {
        result.push(childExtractor(item, arrayOf, hint));
    });
    return result;
}

function objectToArray(object, type) {
    if (util.typeString(object) !== 'Object') {
        return null;
    }
    var result = [];
    var keys = Object.keys(object);
    for (var i = 0; i < keys.length; i++) {
        var data = object[keys[i]];
        if (util.typeString(data) === type) {
            result.push(data);
        }
    }
    // We don't want to return an empty array.
    return result.length === 0 ? null : result;
}

function extractNumber(data, schema, hint) {
    return traverseAndFind(data, 'Number', hint);
}

function extractString(data, schema, hint) {
    return traverseAndFind(data, 'String', hint);
}

function findShape (data, schema, hint) {
    dataStack = []; // Make sure data stack is empty
    return getExtractionFunction(schema)(data, schema, hint);
}

exports.findShape = findShape;
