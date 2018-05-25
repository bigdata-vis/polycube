/*
 * point-line-distance
 *
 * Copyright (c) 2015 Mauricio Poppe
 * Licensed under the MIT license.
 */

'use strict'

var distanceSquared = require('./squared')

module.exports = function (point, a, b) {
  return Math.sqrt(distanceSquared(point, a, b))
}
