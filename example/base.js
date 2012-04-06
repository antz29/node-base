require('coffee-script')

var Base = require('../'),
    connect = require('connect'),
    http = require('http');

var base = new Base();

var app = connect()
	.use(connect.static(__dirname + '/public'))
	.use(connect.favicon())
	.use(base.connect());

http.createServer(app).listen(3000);


