var util = require('./util');

var dataStack; // TODO currently, this never pops

function traverseAndFind(data, searchType, hints, getFirst) {
    var dataType = util.typeString(data);
    if (dataType === searchType && getFirst !== false) {
        // We don't want to do this if we're explicitly only looking
        // for hints. 'Explicit' here means getFirst is false, rather
        // than simply undefined.
        return data;
    }
    var getFirst = (hints === undefined || hints.length === 0) || getFirst;
    switch(dataType) {
        case 'Object':
            return traverseObject(data, searchType, hints, getFirst);
        default:
            // Data is not traversible
            return null;
    }
}

function traverseObject(object, searchType, hints, getFirst) {
    var keys = Object.getOwnPropertyNames(object);
    var hintType = util.typeString(hints);
    // Breadth-first. Let's first look over the members of the object.
    for (var h = 0; hintType === 'Array' && h < hints.length; h++) {
        var hint = hints[h];
        for (var i = 0; i < keys.length; i++) {
            var data = object[keys[i]];
            if (util.typeString(data) === searchType && keys[i] === hint) {
                // Matches hint - return. Move hint to front of stack.
                util.removeFromArray(hints, hints.indexOf(hint));
                hints.unshift(hint);
                return data;
            }
        }
        // If we get to here, we haven't found anything yet. Let's search the children.
        for (var i = 0; i < keys.length; i++) {
            var hinted = traverseAndFind(object[keys[i]], searchType, hints, false);
            if (hinted !== null) {
                return hinted;
            }
        }
    }
    // No hints found anywhere. If we were only looking for these, stop now.
    if (getFirst === false) {
        return null;
    }
    // If we're OK to just return the first type match, let's do that.
    for (var i = 0; i < keys.length; i++) {
        var first = traverseAndFind(object[keys[i]], searchType, hints, true);
        if (first !== null) {
            if (hintType === 'Array') {
                hints.unshift(keys[i]);
            }
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
        case 'Boolean':
            return extractBoolean;
    }
}

function extractObject(data, schema, hints) {
    dataStack.push(data);
    var object = traverseAndFind(data, 'Object', hints);
    var result = {};
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
        result[key] = extractionFunction(object, valueType, newHints);
        // Rotate the current hints (if array)
        if (hintType === 'Array') {
            hints.push(hints.shift());
        }
    });
    return result;
}

function extractArray(data, schema, hints) {
    var arrayOf = schema[0];
    var array = traverseAndFind(data, 'Array', hints);
    // Can't find? Might have gone too deep - use stack.
    if (array === null && dataStack.length > 0) {
        array = traverseAndFind(dataStack[dataStack.length-1], 'Array', hints);
    }
    // TODO should probably prefer to convert to array of key/[vals] objects
    // Still nothing? OK. Let's make an array out of object keys.
    if (array === null) {
        array = objectToArray(data, arrayOf);
    }
    var result = [];
    var childExtractor = getExtractionFunction(arrayOf);
    array.forEach(function (item) {
        result.push(childExtractor(item, arrayOf, hints));
    });
    return result;
}

function objectToArray(object, type) {
    if (util.typeString(object) !== 'Object') {
        return null;
    }
    var result = [];
    var keys = Object.getOwnPropertyNames(object);
    for (var i = 0; i < keys.length; i++) {
        var data = object[keys[i]];
        if (util.typeString(data) === type) {
            result.push(data);
        }
    }
    // We don't want to return an empty array.
    return result.length === 0 ? null : result;
}

function extractNumber(data, schema, hints) {
    return traverseAndFind(data, 'Number', hints);
}

function extractString(data, schema, hints) {
    return traverseAndFind(data, 'String', hints);
}

function extractBoolean(data, schema, hints) {
    return traverseAndFind(data, 'Boolean', hints);
}

function findShape (data, schema, hint) {
    dataStack = []; // Make sure data stack is empty
    var hintType = util.typeString(hint);
    var hints;
    if (hintType === 'Object' || util.typeString(hint) === 'Array') {
        hints = hint;
    } else if (hint == undefined) {
        hints = [];
    } else {
        hints = [hint];
    }
    return getExtractionFunction(schema)(data, schema, hints);
}

exports.findShape = findShape;
