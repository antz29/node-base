_             = require('underscore')
EventEmitter  = require('events').EventEmitter

class Resource extends EventEmitter

  REQUIRED: '*REQ*'

  constructor: (base, opt) ->
    opt = opt or {}
    @base = base
    @options = _.defaults opt, this.defaults

    for prop, val of @options
    	do ->
    		if (val == this.REQUIRED) then throw "#{prop} is a required option for this resource."

  init: ->

  defaults: {}

module.exports = Resource