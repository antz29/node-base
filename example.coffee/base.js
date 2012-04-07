require('coffee-script')
var connect = require('connect')

var Base = require('../');

var base = new Base({
	port: 8000,
	core_language: 'coffee'
});

base.go()