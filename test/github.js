var reshaper = require('../lib/reshaper');
var expect = require('chai').expect;
var fs = require('fs');

var data = JSON.parse(fs.readFileSync('./test/github_popular.json'));

describe('github popular repos', function() {

    it('should extract the correct numbers on with hints provided', function() {
        var schema = [
            {
                x: 'Number',
                y: 'Number'
            }
        ];
        var result = reshaper.findShape(data.items, schema, ['open_issues', 'stargazers_count']);
        var expd = data.items.map(function (item) {
            return {
                x: item.open_issues,
                y: item.stargazers_count
            };
        });
        expect(result).to.eql(expd);
    });

    it('should still work with names added', function() {
        var schema = [
            {
                x: 'Number',
                y: 'Number',
                label: 'String'
            }
        ];
        var result = reshaper.findShape(
            data.items, schema, ['open_issues', 'stargazers_count', 'name']
        );
        var expd = data.items.map(function (item) {
            return {
                x: item.open_issues,
                y: item.stargazers_count,
                label: item.name
            };
        });
        expect(result).to.eql(expd);
    });

    it('should work with object hints', function() {
        var schema = [{label: 'String', value: 'Number'}];
        var hint = {label: 'name', value: 'stargazers_count'};
        var result = reshaper.findShape(data, schema, hint);
        expect(result).to.eql(data.items.map(function (item) {
            return {
                label: item.name,
                value: item.stargazers_count
            }
        }));
    });

});
