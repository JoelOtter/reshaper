var util = require('./util');

// A traverse or extract operation returns an array. The first item in
// the array is the result and the second, if present, is the hint that
// was matched on.
function traverseAndFind(data, searchType, stacks, hints, getFirst) {
    var dataType = util.typeString(data);
    if (dataType === searchType && getFirst !== false) {
        // We don't want to do this if we're explicitly only looking
        // for hints. 'Explicit' here means getFirst is false, rather
        // than simply undefined.
        return {value: data};
    }
    var newHints;
    if (util.typeString(hints) === 'Array') {
        newHints = stacks.goodKeys.concat(hints);
    } else {
        newHints = hints;
    }
    var getFirst = (newHints === undefined || newHints.length === 0) || getFirst;
    switch(dataType) {
        case 'Object':
            return traverseObject(data, searchType, stacks, hints, getFirst);
        default:
            // Data is not traversible
            return {value: null};
    }
}

function traverseObject(object, searchType, stacks, hints, getFirst) {
    var keys = Object.getOwnPropertyNames(object);
    var hintType = util.typeString(hints);
    // If we don't care about the hint, let's grab the first thing we find.
    if (getFirst) {
        for (var i = 0; i < keys.length; i++) {
            var first = traverseAndFind(
                object[keys[i]], searchType, stacks, hints, true
            );
            if (first.value !== null && stacks.staleKeys.indexOf(keys[i]) === -1) {
                if (first.match === undefined) {
                    first.match = keys[i];
                }
                return first;
            }
        }
    }
    // Breadth-first. Let's first look over the members of the object.
    if (hintType === 'Array') {
        var newHints = stacks.goodKeys.concat(hints);
        for (var h = 0; h < newHints.length; h++) {
            var hint = newHints[h];
            var undotted = hint.split('.');
            for (var i = 0; i < keys.length; i++) {
                var data = object[keys[i]];
                if (undotted.length > 1 &&
                    (undotted[0] === keys[i] || undotted[0] === '_')) {
                    // Search this key, unpacking the dotted hint
                    var newStacks = {
                        data: stacks.data,
                        goodKeys: stacks.goodKeys,
                        staleKeys: []
                    };
                    // First, adjust the staleKeys
                    for (var j = 0; j < stacks.staleKeys.length; j++) {
                        var stale = stacks.staleKeys[j];
                        var split = stale.split('.');
                        if (split.length > 1 && split[0] === keys[i]) {
                            newStacks.staleKeys.push(split.slice(1).join('.'));
                        }
                    }
                    var dotHinted = traverseAndFind(
                        data, searchType, newStacks, [undotted.slice(1).join('.')], false
                    );
                    if (dotHinted.value !== null) {
                        dotHinted.match = hint;
                        return dotHinted;
                    }
                }
                if (util.typeString(data) === searchType && keys[i] === hint &&
                    stacks.staleKeys.indexOf(hint) === -1) {
                    return {value: data, match: hint};
                }
            }
        }
    }

    // If we get to here, we haven't found anything yet. Let's search the children.
    for (var i = 0; i < keys.length; i++) {
        var hinted = traverseAndFind(
            object[keys[i]], searchType, stacks, hints, false
        );
        if (hinted.value !== null) {
            return hinted;
        }
    }
    // No hints found anywhere. If we were only looking for these, stop now.
    if (getFirst === false) {
        return {value: null};
    }

    // Still nothing found. Let's force a find-first.
    for (var i = 0; i < keys.length; i++) {
        // If it's a stale key, don't use it.
        if (stacks.staleKeys.indexOf(keys[i]) > -1) {
            continue;
        }
        var first = traverseAndFind(
            object[keys[i]], searchType, stacks, hints, true
        );
        if (first.value !== null) {
            if (first.match === undefined) {
                first.match = keys[i];
            }
            return first;
        }
    }

    // We found nothing.
    return {value: null};
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

function extractObject(data, schema, stacks, hints) {
    stacks.data.unshift(data);
    var newStacks = {
        data: stacks.data,
        staleKeys: stacks.staleKeys.slice(),
        goodKeys: stacks.goodKeys.slice()
    };
    var found = traverseAndFind(data, 'Object', newStacks, hints);
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

function extractArray(data, schema, stacks, hints) {
    var arrayOf = schema[0];
    var newStacks = {
        data: stacks.data,
        staleKeys: stacks.staleKeys.slice(),
        goodKeys: stacks.goodKeys.slice()
    };
    var array = traverseAndFind(data, 'Array', newStacks, hints);
    // Can't find? Might have gone too deep - use stack.
    if (array.value === null && newStacks.data.length > 0) {
        array = traverseAndFind(newStacks.data[0], 'Array', newStacks, hints);
    }
    // TODO should probably prefer to convert to array of key/[vals] objects
    // Still nothing? OK. Let's make an array out of object keys.
    if (array.value === null) {
        array = objectToArray(data, arrayOf);
    }
    var result = {value: []};
    if (array.match !== undefined) {
        result.match = array.match;
    }
    var childExtractor = getExtractionFunction(arrayOf);
    var foundMatch;
    array.value.forEach(function (item) {
        var found = childExtractor(item, arrayOf, newStacks, hints);
        if (found.value != null) {
            result.value.push(found.value);
            if (found.match !== undefined) {
                foundMatch = found.match;
                if (newStacks.goodKeys.indexOf(found.match) === -1) {
                    newStacks.goodKeys.unshift(found.match);
                }
            }
        }
    });
    result.match = foundMatch;
    if (result.value.length === 0 && array.match) {
        newStacks.staleKeys.push(array.match);
        result = extractArray(data, schema, newStacks);
    }
    return result;
}

function objectToArray(object, type) {
    if (util.typeString(object) !== 'Object') {
        return {value: null};
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
    var result = {};
    result.value = array.length === 0 ? null : array;
    return result;
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

function findShape (data, schema, hint) {
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

exports.findShape = findShape;
