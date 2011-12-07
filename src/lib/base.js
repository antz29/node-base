module.exports = (function() {

	// Dependencies
	var	fs 	= require('fs'),
	   	configr = require('configr').create(),
		twister = require('twister').create(),
		slicer 	= require('slicer').create(),
		_ 	= require('underscore'),
		async 	= require('async'),
		EventEmitter = require('events').EventEmitter,
		util	= require('util'),
		path 	= require('path'),
		ready	= false,
		engine	= null,
		renderer = null,

		// Register supported template engines
		template_engines = {
			'jqtpl' : {
				'init' : function() {
					return require('jqtpl');
				},
				'render' : function(template, tdata, callback) {
					callback(null,engine.tmpl(template, tdata));
				}
			}
		};

	// Private members
	var options;

	// Constructor
	function Base(opt) {
		var that = this;
		opt = opt || {};

		console.log("Initializing Base...");
		options = _.defaults(opt,{
			'root' : path.resolve(path.dirname(process.argv[0])),
			'config' : '/config',
			'controllers' : '/controllers',
			'views' : '/views',
			'models' : '/models'
		});

		configr.setDirectory(options.root + options.config);

		console.log("Loading the configuration in " + options.root + options.config);
		configr.load(function() {
			twister.addRules(configr.get().routes || []);

			slicer.addSegmentIdentifier('controller','index');
			slicer.addSegmentIdentifier('action','index');

			options.template_engine = (configr.get().general && configr.get().general.template_engine) ? configr.get().general.template_engine : 'jqtpl';
			engine = template_engines[options.template_engine].init();
			renderer = template_engines[options.template_engine].render;

			ready = true;
			that.emit('ready');
			
			console.log("Base Framework is ready to accept requests!");
		});
	}
	
	// Extend EventEmitter
	util.inherits(Base, EventEmitter);

	Base.prototype.addTemplateEngine = function(name,def) {
		template_engines[name] = def;
	}

	Base.prototype.getOptions = function() {
		return options;
	}

	Base.prototype.connect = function(req,res,next) {
		var that = this;

		function ifReady() {
			if (ready) return whenReady();
			process.nextTick(ifReady);
		}

		process.nextTick(ifReady);

		function whenReady() {
			
			var tdata = {};

			async.series({
				'twister' : function(callback) {
					twister.twist(req.url,function(twisted) {
						req.url = twisted;
						callback(null);
					});
				},
				'splicer' : function(callback) {
					var sl = slicer.slice(req.url);
					req.controller = sl.controller;
					req.action = sl.action;
					req.params = sl.uri;
					callback(null);
				},
				'controller' : function(callback) {
					var controller, action;
					var target = options.root + options.controllers + '/' + req.controller + '.js';
					
					fs.stat(target, function(err) {	
						if (err) return callback(null);

						controller = require(target);
						controller.getBase = function() { return that; }

						callPreAction(function() {	
							var method = req.method.toLowerCase();
							var method_action = req.action + '_' + method;
						
							var controller_action;
	
							if (controller[method_action]) {
								controller_action = controller[req.action + '_' + method];
							}
							else if (controller[req.action]) {
								controller_action = controller[req.action];
							}

							controller_action(req,res,function(td) {
								tdata = td;
								callback(null);
								process.nextTick(callPostAction);
							}); 
						});

						function callPreAction(callback) {
							if (controller.pre_action) {
								return controller.pre_action(req,res,callback);
							}
							callback();
						}

						function callPostAction() {
							if (controller.post_action) { 
								process.nextTick(function() {
									controller.post_action(req);
								});
							}
						}
					});
				},
				'view' : function(callback) {
					target = options.root + options.views + '/' + req.controller + '/' + req.action + '.' + options.template_engine;
					(function(template,callback) {
						fs.readFile(template,"utf8", function(err,tmpdata) {
							if (err) {
								res.statusCode = 404;
								return res.end("<h1>404 Not Found</h1>");
							}

							tdata.controller  	= req.controller;
							tdata.action 		= req.action;
							tdata.layout		= tdata.layout || 'layout';
				
							target = options.root + options.views + '/' + tdata.layout + '.' +  options.template_engine;

							fs.readFile(target,"utf8", function(err,laydata) {
								renderer(tmpdata, tdata, function(e,content) {
									if (err) return callback(content);

									tdata.content = content;
									renderer(laydata, tdata, function(e,content) {
										return callback(content);
									});
								});
							});					
						});
					}(target,function(out) { callback(null,out); }));
				}
			}, function(err,data) {
				if (!res.getHeader('content-type')) res.setHeader("content-type", "text/html");
				res.end(data.view);
			});

		}; 
	};

	Base.prototype.getConfig = function() {
		return configr.get();
	};

	return Base;
}());
