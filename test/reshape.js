var reshaper = require('../lib/reshaper');
var expect = require('chai').expect;

describe('reshaper', function() {

    describe('#findShape()', function() {

        var schema = ['Number']
        var data = [
            {x: 12, y: 5},
            {x: 2, y: 3},
            {x: 9, y: 14}
        ];
        var peopleData = [
            {
                name: 'Joel',
                info: {
                    age: 23,
                    middleName: 'Robert',
                    lastName: 'Auterson'
                }
            },
            {
                name: 'Jake',
                info: {
                    age: 24,
                    middleName: 'Wild',
                    lastName: 'Hall'
                }
            }
        ];

        it('should return array of x values without hinting', function() {
            var result = reshaper.findShape(data, schema);
            expect(result).to.eql([12, 2, 9]);
        });

        it('should return array of y values with y hint', function() {
            var result = reshaper.findShape(data, schema, 'y');
            expect(result).to.eql([5, 3, 14]);
        });

        it('should extract ages from people data', function() {
            var result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql([23, 24]);
        });

        it('should extract first names from people data', function() {
            var schema = ['String'];
            var result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql(['Joel', 'Jake']);
        });

        it('should extract last names from people data', function() {
            var schema = ['String'];
            var result = reshaper.findShape(peopleData, schema, 'lastName');
            expect(result).to.eql(['Auterson', 'Hall']);
        });

        it('should extract arrays of simple objects from people data', function() {
            var schema = [{name: 'String', age: 'Number'}];
            var result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql([
                {
                    name: 'Joel',
                    age: 23
                },
                {
                    name: 'Jake',
                    age: 24
                }
            ]);
        });

        it('should return the same data when called with a matching schema', function() {
            var peopleSchema = [
                {
                    name: 'String',
                    info: {
                        age: 'Number',
                        middleName: 'String',
                        lastName: 'String'
                    }
                }
            ];
            var result = reshaper.findShape(peopleData, peopleSchema);
            expect(result).to.eql(peopleData);
        });

    });

});
