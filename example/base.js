var Base = require('../'),
    connect = require('connect');

var base = new Base();

connect(
	connect.static(__dirname + '/public'),
	connect.favicon(),
	base.connect
).listen(3000);


