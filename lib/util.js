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

function removeFromArray(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};

function NotFoundException(data, schema, hint) {
    this.name = 'NotFoundException';
    this.stack = (new Error()).stack;
    this.message = 'Could not find ' + typeString(schema, true);
    this.data = data;
    this.schema = schema;
    this.hint = hint;
}
NotFoundException.prototype = Object.create(Error.prototype);
NotFoundException.prototype.constructor = NotFoundException;

exports.typeString = typeString;
exports.typesMatch = typesMatch;
exports.removeFromArray = removeFromArray;
exports.NotFoundException = NotFoundException;
