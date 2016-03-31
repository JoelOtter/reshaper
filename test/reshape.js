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
                    height: 1.9,
                    middleName: 'Robert',
                    lastName: 'Auterson'
                }
            },
            {
                name: 'Jake',
                info: {
                    age: 24,
                    height: 1.85,
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
            var schema = [
                {
                    name: 'String',
                    info: {
                        age: 'Number',
                        height: 'Number',
                        middleName: 'String',
                        lastName: 'String'
                    }
                }
            ];
            var result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql(peopleData);
        });

        it('should extract separate arrays into an object', function() {
            var schema = {
                age: ['Number'],
                height: ['Number']
            };
            var result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql({
                age: [23, 24],
                height: [1.9, 1.85]
            });
        });

        it('should extract arrays from varying depths into object', function() {
            var schema = {
                name: ['String'],
                lastName: ['String']
            };
            var result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql({
                name: ['Joel', 'Jake'],
                lastName: ['Auterson', 'Hall']
            });
        });

        it('should not matter what order the schema is in', function() {
            var schema = {
                name: ['String'],
                lastName: ['String'],
                middleName: ['String']
            };
            var result = reshaper.findShape(peopleData, schema);
            schema = {
                lastName: ['String'],
                middleName: ['String'],
                name: ['String']
            };
            var result2 = reshaper.findShape(peopleData, schema);
            expect(result2).to.eql(result);
        });

        it('should, with no hint, pick the shallowest', function() {
            var schema = ['String'];
            var result = reshaper.findShape(peopleData, schema, 'firstName');
            expect(result).to.eql(['Joel', 'Jake']);
            schema = {
                firstName: ['String'],
                lastName: ['String']
            };
            result = reshaper.findShape(peopleData, schema);
            expect(result).to.eql({
                firstName: ['Joel', 'Jake'],
                lastName: ['Auterson', 'Hall']
            });
        });

        it('should be able to construct arrays from different levels', function() {
            var rectangles = [
                {
                    width: 5,
                    height: 4,
                    colour: {
                        red: 255,
                        green: 128,
                        blue: 0
                    }
                },
                {
                    width: 10,
                    height: 2,
                    colour: {
                        red: 50,
                        green: 90,
                        blue: 255
                    }
                }
            ];
            var schema = {
                width: ['Number'],
                red: ['Number']
            };
            var result = reshaper.findShape(rectangles, schema);
            expect(result).to.eql({
                width: [5, 10],
                red: [255, 50]
            });
        });

    });

});
