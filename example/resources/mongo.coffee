Resource = require('../../').Resource
mongodb = require('mongodb')

class Mongo extends Resource

	db : null
	server : null
	client : null

	defaults:
		db : Resource.REQUIRED
		port : 27017
		host : "127.0.0.1"
		options : {}

	init: =>
		server = new mongodb.Server @options.host, @options.port, @options.options
		db = new mongodb.Db(@options.db, server)
		db.open (error, client) =>
			if (error) then throw error
			@client = client
			this.emit 'ready'

	getCollection: (name) =>
		new mongodb.Collection(@client, name)

module.exports = Mongo