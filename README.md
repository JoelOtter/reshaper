# Reshaper

[![Build Status](https://travis-ci.org/JoelOtter/reshaper.svg?branch=master)](https://travis-ci.org/JoelOtter/reshaper) [![Coverage Status](https://coveralls.io/repos/github/JoelOtter/reshaper/badge.svg?branch=master)](https://coveralls.io/github/JoelOtter/reshaper?branch=master) [![](https://img.shields.io/npm/v/reshaper.svg)](https://www.npmjs.com/package/reshaper)

Reshaper is a JavaScript library which can automatically restructure JavaScript objects to match a provided schema. It also provides users with some manual control, by way of a 'hint' system.

To see some interactive examples, check out this [Kajero notebook](http://www.joelotter.com/reshaper).

## Installation

`npm install reshaper`

## Usage

#### `reshaper(data, schema, [hint])`

- `data`: The JavaScript data structure to be reshaped.
- `schema`: The structure we want our reshaped data to match.
- `hint`: _(Optional)_ The name of an object key, given as a 'hint'. Keys matching this hint will be preferred. An array of keys can also be provided if desired.

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

reshaper(peopleData, schema);
// => ['Joel', 'Jake']

// We can give a 'hint', to say lastName is what we want.
reshaper(peopleData, schema, 'lastName');
// => ['Auterson', 'Hall']

// Object keys get used as hints
var schema = {
    age: ['Number'],
    height: ['Number']
};

reshaper(peopleData, schema);
/* =>
{
    age: [22, 24],
    height: [1.9, 1.85]
}
*/

```
