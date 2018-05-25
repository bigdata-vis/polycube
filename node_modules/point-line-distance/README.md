# point-line-distance 

[![npm][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![js-standard-style][standard-image]][standard-url]

Computes the distance between a point and a line defined with any two points lying on it

## Install

```sh
$ npm install --save point-line-distance
```

## Usage

Let

```js
var point = [1, 0, 1]
var a = [1, 2, -1]
var b = [2, 0, 3]
```

Compute the distance as follows

```js
var pld = require('point-line-distance');
pld(point, a, b)  // Math.sqrt(8 / 7)
```

If you need the squared distance require `squared` as follows

```js
var pldSquared = require('point-line-distance/squared');
pldSquared(point, a, b)  // 8 / 7
```

## API

```
pld = require('point-line-distance')
```

### `pld(point, a, b)`

**params**

* `point` [Array] the target point
* `a` [Array] and `b` [Array] are two points that define a line

**returns**

The distance between `point` and the line defined by `a` and `b`

**throws**

Throws an error when `a === b`

## License

2015 MIT © [Mauricio Poppe](http://maurizzzio.com)

[travis-image]: https://travis-ci.org/maurizzzio/point-line-distance.svg?branch=master
[travis-url]: https://travis-ci.org/maurizzzio/point-line-distance
[npm-image]: https://img.shields.io/npm/v/point-line-distance.svg?style=flat
[npm-url]: https://npmjs.org/package/point-line-distance
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: http://standardjs.com/
[coveralls-image]: https://coveralls.io/repos/maurizzzio/point-line-distance/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/r/maurizzzio/point-line-distance
