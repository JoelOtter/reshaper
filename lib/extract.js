/*
 * Functions for extracting - creating the structure defined in the schema
 */

var util = require('./util');
var traverseAndFind = require('./traverse');

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
        case 'Boolean':
            return extractBoolean;
    }
}

function extractObject(data, schema, stacks, hints) {
    stacks.data.unshift(data);
    var newStacks = {
        data: stacks.data,
        staleKeys: stacks.staleKeys.slice(),
        goodKeys: stacks.goodKeys.slice()
    };
    var found;
    try {
        found = traverseAndFind(data, 'Object', newStacks, hints);
    } catch (err) {
        // If not found, create some dummy data. This will allow the
        // backtracking to work, rather than giving up here.
        found = {value: undefined};
    }
    var object = found.value;
    var result = {value: {}};
    var keys = Object.getOwnPropertyNames(schema);
    keys.forEach(function (key) {
        var valueType = schema[key];
        var extractionFunction = getExtractionFunction(valueType);
        var hintType = util.typeString(hints);
        var newHints;
        if (hintType === 'Object') {
            if (hints.hasOwnProperty(key)) {
                var child = hints[key];
                if (util.typeString(child) === 'Array') {
                    newHints = child.slice();
                    newHints.push(key);
                } else if (util.typeString(child) === 'Object') {
                    newHints = child;
                } else {
                    newHints = [child];
                    newHints.push(key);
                }
            } else {
                newHints = hints;
            }
        } else {
            newHints = hints.slice();
            newHints.push(key);
        }
        var extracted = extractionFunction(object, valueType, newStacks, newHints);
        result.value[key] = extracted.value;
        if (extracted.match) {
            newStacks.staleKeys.push(extracted.match);
        }
    });
    return result;
}

function extractArrayFromBacktrack(data, schema, stacks, hints) {
    if (stacks.data.length > 0) {
        return traverseAndFind(stacks.data[0], 'Array', stacks, hints);
    }
    throw new util.NotFoundException(data, schema, hints);
}

function extractArray(data, schema, stacks, hints) {
    var arrayOf = schema[0];
    var newStacks = {
        data: stacks.data,
        staleKeys: stacks.staleKeys.slice(),
        goodKeys: stacks.goodKeys.slice()
    };
    var array;
    try {
        array = traverseAndFind(data, 'Array', newStacks, hints);
    } catch (err) {
        // Can't find? Might have gone too deep - use stack.
        try {
            array = extractArrayFromBacktrack(data, schema, newStacks, hints);
        } catch (err) {
            // TODO should probably prefer to convert to array of key/[vals] objects
            // Still nothing? OK. Let's make an array out of object keys.
            array = objectToArray(data, arrayOf);
        }
    }
    var result = {value: []};
    if (array.match !== undefined) {
        result.match = array.match;
    }
    // We've got the array from data, let's construct our new one
    var childExtractor = getExtractionFunction(arrayOf);
    var foundMatch;
    array.value.forEach(function (item) {
        try {
            var found = childExtractor(item, arrayOf, newStacks, hints);
            result.value.push(found.value);
            if (found.match !== undefined) {
                foundMatch = found.match;
                if (newStacks.goodKeys.indexOf(found.match) === -1) {
                    newStacks.goodKeys.unshift(found.match);
                }
            }
        } catch (err) {
            // Don't add to result array
        }
    });
    result.match = foundMatch;
    if (result.value.length === 0) {
        if (array.match) {
            newStacks.staleKeys.push(array.match);
            result = extractArray(data, schema, newStacks);
        } else {
            throw new util.NotFoundException(data, schema, hints);
        }
    }
    return result;
}

function objectToArray(object, type) {
    if (util.typeString(object) !== 'Object') {
        throw new util.NotFoundException(object, type);
    }
    var array = [];
    var keys = Object.getOwnPropertyNames(object);
    for (var i = 0; i < keys.length; i++) {
        var data = object[keys[i]];
        if (util.typeString(data) === type) {
            array.push(data);
        }
    }
    // We don't want to return an empty array.
    if (array.length === 0) {
        throw new util.NotFoundException(object, type);
    }
    return {value: array};
}

function extractNumber(data, schema, stacks, hints) {
    return traverseAndFind(data, 'Number', stacks, hints);
}

function extractString(data, schema, stacks, hints) {
    return traverseAndFind(data, 'String', stacks, hints);
}

function extractBoolean(data, schema, stacks, hints) {
    return traverseAndFind(data, 'Boolean', stacks, hints);
}


module.exports = getExtractionFunction;
