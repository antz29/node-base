Controller = require('../../').Controller

class Index extends Controller

	index: (req,res,callback) =>
		mongo = this.base.getResource('mongo')
		
		callback
			'title' : 'Hello world!'

module.exports = Index