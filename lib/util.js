function typeString (item, preserveStrings) {
    var typeString = Object.prototype.toString.call(item);
    typeString = typeString.split(' ')[1].split(']')[0];
    if (preserveStrings && typeString === 'String') {
        return item;
    }
    return typeString;
}

function typesMatch (itemA, itemB) {
    return typeString(itemA) === typeString(itemB);
}

exports.typeString = typeString;
exports.typesMatch = typesMatch;
