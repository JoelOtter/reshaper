/*
 * Functions for traversing the user-provided data structure.
 */

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
            throw new util.NotFoundException(data, searchType, hints);
    }
}

function traverseWithDottedHint(data, searchType, stacks, hint, undotted) {
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
        if (split.length > 1 && split[0] === undotted[0]) {
            newStacks.staleKeys.push(split.slice(1).join('.'));
        }
    }
    var dotHinted = traverseAndFind(
        data, searchType, newStacks, [undotted.slice(1).join('.')], false
    );
    dotHinted.match = hint;
    return dotHinted;
}

function traverseWithHints(object, searchType, stacks, hints) {
    var keys = Object.getOwnPropertyNames(object);
    var newHints = stacks.goodKeys.concat(hints);
    for (var h = 0; h < newHints.length; h++) {
        var hint = newHints[h];
        var undotted = hint.split('.');
        for (var i = 0; i < keys.length; i++) {
            var data = object[keys[i]];

            // If the hint is a dotted hint, attempt to unpack it.
            if (undotted.length > 1 &&
                (undotted[0] === keys[i] || undotted[0] === '_')) {
                try {
                    return traverseWithDottedHint(
                        data, searchType, stacks, hint, undotted
                    );
                } catch (err) {
                    // We didn't get anything with dotted hints, continue.
                }
            }

            // Not a dotted hint, or nothing found with dotted hint.
            // Search at this level with regular hints.
            if (util.typeString(data) === searchType && keys[i] === hint &&
                stacks.staleKeys.indexOf(hint) === -1) {
                return {value: data, match: hint};
            }
        }
    }
    throw new util.NotFoundException(object, searchType, hints);
}

function traverseWithGetFirst(object, searchType, stacks, hints, isFinal) {
    var keys = Object.getOwnPropertyNames(object);
    for (var i = 0; i < keys.length; i++) {
        if (stacks.staleKeys.indexOf(keys[i]) > -1) {
            continue;
        }
        try {
            var first = traverseAndFind(
                object[keys[i]], searchType, stacks, hints, true
            );
            if (first.match === undefined) {
                first.match = keys[i];
            }
            return first;
        } catch (err) {
            continue;
        }
    }
    throw new util.NotFoundException(object, searchType, hints);
}

function traverseObject(object, searchType, stacks, hints, getFirst) {
    var hintType = util.typeString(hints);
    var keys = Object.getOwnPropertyNames(object);

    // If we don't care about the hint, let's grab the first thing we find.
    if (getFirst) {
        return traverseWithGetFirst(object, searchType, stacks, hints);
    }

    // Search using the hints
    if (hintType === 'Array') {
        try {
            return traverseWithHints(object, searchType, stacks, hints);
        } catch (err) {
            // Nothing found at this level using hints.
        }
    }

    // If we get to here, we haven't found anything yet. Let's search the children.
    for (var i = 0; i < keys.length; i++) {
        try {
            return traverseAndFind(
                object[keys[i]], searchType, stacks, hints, false
            );
        } catch (err) {
            continue;
        }
    }

    // No hints found anywhere. If we were only looking for these, stop now.
    if (getFirst === false) {
        throw new util.NotFoundException(object, searchType, hints);
    }

    // Still nothing found. Let's force a find-first.
    return traverseWithGetFirst(object, searchType, stacks, hints);
}

module.exports = traverseAndFind;
