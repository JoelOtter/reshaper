var util = require('./util');

var dataStack; // TODO currently, this never pops
var staleKeys;

// A traverse or extract operation returns an array. The first item in
// the array is the result and the second, if present, is the hint that
// was matched on.
function traverseAndFind(data, searchType, hints, getFirst) {
    var dataType = util.typeString(data);
    if (dataType === searchType && getFirst !== false) {
        // We don't want to do this if we're explicitly only looking
        // for hints. 'Explicit' here means getFirst is false, rather
        // than simply undefined.
        return [data];
    }
    var getFirst = (hints === undefined || hints.length === 0) || getFirst;
    switch(dataType) {
        case 'Object':
            return traverseObject(data, searchType, hints, getFirst);
        default:
            // Data is not traversible
            return [null];
    }
}

function traverseObject(object, searchType, hints, getFirst) {
    var keys = Object.getOwnPropertyNames(object);
    var hintType = util.typeString(hints);
    // If we don't care about the hint, let's grab the first thing we find.
    if (getFirst) {
        for (var i = 0; i < keys.length; i++) {
            var first = traverseAndFind(object[keys[i]], searchType, hints, true);
            if (first[0] !== null && staleKeys[0].indexOf(keys[i]) === -1) {
                if (hintType === 'Array') {
                    hints.unshift(keys[i]);
                }
                if (first[1] === undefined) {
                    first[1] = keys[i];
                }
                return first;
            }
        }
    }
    // Breadth-first. Let's first look over the members of the object.
    for (var h = 0; hintType === 'Array' && h < hints.length; h++) {
        var hint = hints[h];
        var undotted = hint.split('.');
        for (var i = 0; i < keys.length; i++) {
            var data = object[keys[i]];
            if (undotted.length > 1 &&
                (undotted[0] === keys[i] || undotted[0] === '_')) {
                // Search this key, unpacking the dotted hint
                var dotHinted = traverseAndFind(
                    data, searchType, [undotted.slice(1).join('.')], false
                );
                if (dotHinted[0] !== null) {
                    return dotHinted;
                }
            }
            if (util.typeString(data) === searchType && keys[i] === hint) {
                // Matches hint - return. Move hint to front of stack.
                util.removeFromArray(hints, hints.indexOf(hint));
                hints.unshift(hint);
                return [data];
            }
        }
    }
    // If we get to here, we haven't found anything yet. Let's search the children.
    for (var i = 0; i < keys.length; i++) {
        var hinted = traverseAndFind(object[keys[i]], searchType, hints, false);
        if (hinted[0] !== null) {
            return hinted;
        }
    }
    // No hints found anywhere. If we were only looking for these, stop now.
    if (getFirst === false) {
        return [null];
    }

    // Still nothing found. Let's force a find-first.
    for (var i = 0; i < keys.length; i++) {
        // If it's a stale key, don't use it.
        if (staleKeys[0].indexOf(keys[i]) > -1) {
            continue;
        }
        var first = traverseAndFind(object[keys[i]], searchType, hints, true);
        if (first[0] !== null) {
            if (hintType === 'Array') {
                hints.unshift(keys[i]);
            }
            if (first[1] === undefined) {
                first[1] = keys[i];
            }
            return first;
        }
    }

    // We found nothing.
    return [null];
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
    staleKeys.unshift(staleKeys[0].slice());
    var found = traverseAndFind(data, 'Object', hints);
    var object = found[0];
    var result = [{}];
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
        var extracted = extractionFunction(object, valueType, newHints);
        result[0][key] = extracted[0];
        if (extracted[1]) {
            staleKeys[0].push(extracted[1]);
        }
        // Rotate the current hints (if array)
        if (hintType === 'Array' && hints.length > 0) {
            hints.push(hints.shift());
        }
    });
    staleKeys.shift();
    return result;
}

function extractArray(data, schema, hints) {
    staleKeys.unshift(staleKeys[0].slice());
    var arrayOf = schema[0];
    var array = traverseAndFind(data, 'Array', hints);
    // Can't find? Might have gone too deep - use stack.
    if (array[0] === null && dataStack.length > 0) {
        array = traverseAndFind(dataStack[dataStack.length-1], 'Array', hints);
    }
    // TODO should probably prefer to convert to array of key/[vals] objects
    // Still nothing? OK. Let's make an array out of object keys.
    if (array[0] === null) {
        array = objectToArray(data, arrayOf);
    }
    var result = [[]];
    if (array[1] !== undefined) {
        result[1] = array[1];
    }
    var childExtractor = getExtractionFunction(arrayOf);
    array[0].forEach(function (item) {
        var found = childExtractor(item, arrayOf, hints)[0];
        if (found != null) {
            result[0].push(found);
        }
    });
    if (result[0].length === 0 && array[1]) {
        staleKeys[0].push(array[1]);
        result = extractArray(data, schema);
    }
    staleKeys.shift();
    return result;
}

function objectToArray(object, type) {
    if (util.typeString(object) !== 'Object') {
        return [null];
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
    return result.length === 0 ? [null] : [result];
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
    staleKeys = [[]];
    var hintType = util.typeString(hint);
    var hints;
    if (hintType === 'Object' || hintType === 'Array') {
        hints = hint;
    } else if (hint == undefined) {
        hints = [];
    } else {
        hints = [hint];
    }
    return getExtractionFunction(schema)(data, schema, hints)[0];
}

exports.findShape = findShape;
