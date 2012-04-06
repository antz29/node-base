_             = require('underscore')
EventEmitter  = require('events').EventEmitter

class Resource extends EventEmitter

  constructor: (base, opt) ->
    opt = opt or {}
    @base = base

    @options = _.defaults opt, this.defaults

  getOptions: -> return @options
  getBase: -> @base

  defaults: {}

module.exports = Resource