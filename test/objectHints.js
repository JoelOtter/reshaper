var reshaper = require('../lib/reshaper');
var expect = require('chai').expect;

describe('object hints', function() {

    var peopleData = [
        {
            name: 'Joel',
            info: {
                age: 23,
                height: 1.9,
                middleName: 'Robert',
                lastName: 'Auterson',
                twitter: '@JoelOtter'
            }
        },
        {
            name: 'Jake',
            info: {
                age: 24,
                height: 1.85,
                middleName: 'Wild',
                lastName: 'Hall',
                twitter: '@JakeWildHall'
            }
        }
    ];

    it('should allow object hints', function() {
        var schema = {
            x: ['String'],
            y: ['String']
        };
        var hint = {
            x: 'twitter',
            y: 'middleName'
        };
        var result = reshaper.findShape(peopleData, schema, hint);
        expect(result).to.eql({
            x: ['@JoelOtter', '@JakeWildHall'],
            y: ['Robert', 'Wild']
        });
    });

    it('should allow nested object hints', function() {
        var schema = {
            x: ['String'],
            y: [{
                a: 'String',
                b: 'Number'
            }]
        };
        var hint = {
            x: 'middleName',
            y: {
                a: 'twitter',
                b: 'height'
            }
        };
        var result = reshaper.findShape(peopleData, schema, hint);
        expect(result).to.eql({
            x: ['Robert', 'Wild'],
            y: [
                {
                    a: '@JoelOtter',
                    b: 1.9
                },
                {
                    a: '@JakeWildHall',
                    b: 1.85
                }
            ]
        });
    });

    it('should allow array hints inside objects', function() {
        var schema = {
            x: ['String'],
            y: [{
                a: 'String',
                b: 'Number'
            }]
        };
        var hint = {
            x: 'middleName',
            y: ['twitter', 'height']
        };
        var result = reshaper.findShape(peopleData, schema, hint);
        expect(result).to.eql({
            x: ['Robert', 'Wild'],
            y: [
                {
                    a: '@JoelOtter',
                    b: 1.9
                },
                {
                    a: '@JakeWildHall',
                    b: 1.85
                }
            ]
        });
    });

    it('should allow missing hints', function() {
        var schema = {
            a: ['String'],
            b: ['String']
        };
        var hint = {
            a: 'lastName'
        };
        var result = reshaper.findShape(peopleData, schema, hint);
        expect(result).to.eql({
            a: ['Auterson', 'Hall'],
            b: ['Joel', 'Jake']
        });
    });

});
