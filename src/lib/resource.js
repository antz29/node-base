

module.exports = (function() {

	// Dependencies
	var	fs 		= require('fs'),
		_ 		= require('underscore'),
		async 		= require('async'),
		EventEmitter 	= require('events').EventEmitter,
		util		= require('util'),
		path 		= require('path');

	// Private members
	var 	options,
		base;

	// Constructor
	function Resource(base_core, opt) {
		base = base_core;
		var that = this;
		opt = opt || {};

		options = _.defaults(opt,this.defaults);
	}
	
	// Extend EventEmitter
	util.inherits(Resource, EventEmitter);

	Resource.prototype.defaults = {};
	Resource.prototype.getOptions = function() { return options; };
	Resource.prototype.getBase = function() { return base; };
	Resource.prototype.init = function() { return this; };
	
	return Resource;
}());
