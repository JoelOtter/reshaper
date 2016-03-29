var expect = require('chai').expect;
var util = require('../lib/util');

describe('util', function() {

    describe('#typeString()', function() {

        it('should return "Null" for null', function() {
            expect(util.typeString(null)).to.equal('Null');
        });

        it('should return "Undefined" for undefined', function() {
            expect(util.typeString(undefined)).to.equal('Undefined');
        });

        it('should return "String" for a string without preserveString', function() {
            expect(util.typeString('hello', true)).to.equal('hello');
        });

        it('should return the string itself with preserveString', function() {
            expect(util.typeString('hello', true)).to.equal('hello');
        });

        it('should return "Array" for an array', function() {
            expect(util.typeString([])).to.equal('Array');
            expect(util.typeString([1])).to.equal('Array');
        });

        it('should return "Number" for a number', function() {
            expect(util.typeString(0)).to.equal('Number');
            expect(util.typeString(NaN)).to.equal('Number');
            expect(util.typeString(Infinity)).to.equal('Number');
        });

        it('should return "Object" for an object', function() {
            expect(util.typeString({})).to.equal('Object');
            expect(util.typeString({test: 1})).to.equal('Object');
        });

        it('should return "Function" for a function', function() {
            expect(util.typeString(console.log)).to.equal('Function');
        });

    });

    describe('#typesMatch()', function() {

        it('should return True for two different objects', function() {
            expect(util.typesMatch({test: 1}, {test: 2})).to.equal(true);
        });

        it('should return False for an object and an array', function() {
            expect(util.typesMatch({}, [])).to.equal(false);
        });

    });

});
