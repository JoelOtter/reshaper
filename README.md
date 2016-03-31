# Reshaper

Reshaper is a JavaScript library which can automatically restructure JavaScript objects to match a provided schema. It also provides users with some manual control, by way of a 'hint' system.

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

reshaper.findShape(peopleData, schema, 'lastName');
// => ['Auterson', 'Hall']

```
