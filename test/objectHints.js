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

    var peoplePetData = [
        {
            name: 'Joel',
            pet: {
                name: 'Tony',
                species: 'Dog',
                toy: {
                    name: 'Wobbles'
                }
            }
        },
        {
            name: 'Andrea',
            pet: {
                name: 'Carluccio',
                species: 'Pasta',
                toy: {
                    name: 'Luigi'
                }
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
        var result = reshaper(peopleData, schema, hint);
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
        var result = reshaper(peopleData, schema, hint);
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
        var result = reshaper(peopleData, schema, hint);
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
        var result = reshaper(peopleData, schema, hint);
        expect(result).to.eql({
            a: ['Auterson', 'Hall'],
            b: ['Joel', 'Jake']
        });
    });

    it('should allow dotted hints', function() {
        var schema = [{
            name: 'String',
            pet: 'String'
        }];

        var result = reshaper(peoplePetData, schema, {pet: 'pet.name'});
        expect(result).to.eql([
            {name: 'Joel', pet: 'Tony'},
            {name: 'Andrea', pet: 'Carluccio'}
        ]);
        result = reshaper(peoplePetData, schema, {pet: 'pet.toy.name'});
        expect(result).to.eql([
            {name: 'Joel', pet: 'Wobbles'},
            {name: 'Andrea', pet: 'Luigi'}
        ]);
    });

    it('should allow wildcards in dotted hints', function() {
        var schema = [{
            name: 'String',
            pet: 'String'
        }];

        result = reshaper(peoplePetData, schema, {pet: '_._.name'});
        expect(result).to.eql([
            {name: 'Joel', pet: 'Wobbles'},
            {name: 'Andrea', pet: 'Luigi'}
        ]);
    });

});
