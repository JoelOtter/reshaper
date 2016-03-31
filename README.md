# Reshaper

[![Build Status](https://travis-ci.org/JoelOtter/reshaper.svg?branch=master)](https://travis-ci.org/JoelOtter/reshaper) [![Coverage Status](https://coveralls.io/repos/github/JoelOtter/reshaper/badge.svg?branch=master)](https://coveralls.io/github/JoelOtter/reshaper?branch=master)

Reshaper is a JavaScript library which can automatically restructure JavaScript objects to match a provided schema. It also provides users with some manual control, by way of a 'hint' system.

**Note**: Reshaper is currently in active development. I don't yet consider it to be stable or suitable for serious usage. For this reason, I haven't yet published it to NPM.

## Usage

#### reshaper.findShapes(data, schema, [hint])

- `data`: The JavaScript data structure to be reshaped.
- `schema`: The structure we want our reshaped data to match.
- `hint`: _(Optional)_ The name of an object key, given as a 'hint'. Keys matching this hint will be preferred.

## Examples

```javascript
var reshaper = require('reshaper');

var peopleData = [
    {
        name: 'Joel',
        info: {
            age: 22,
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

var schema = ['String'];

reshaper.findShape(peopleData, schema);
// => ['Joel', 'Jake']

// We can give a 'hint', to say lastName is what we want.
reshaper.findShape(peopleData, schema, 'lastName');
// => ['Auterson', 'Hall']

// Object keys get used as hints
var schema = {
    age: ['Number'],
    height: ['Number']
};

reshaper.findShape(peopleData, schema);
/* =>
{
    age: [22, 24],
    height: [1.9, 1.85]
}
*/

```
