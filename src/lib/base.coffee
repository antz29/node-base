
fs            = require('fs')
Configr       = require('configr')
Twister       = require('twister')
Slicer        = require('slicer')
_             = require('underscore')
async         = require('async')
EventEmitter  = require('events').EventEmitter
path          = require('path')
connect       = require('connect')
http          = require('http');

class Base extends EventEmitter

  ready = false
  engine  = null
  renderer = null
  twister = null
  slicer = null
  configr = null
  pre = []
  post = []

  constructor: (opt) ->
    opt = opt or {}
    root = path.resolve(path.dirname(process.argv[1]))

    console.log "Initializing Base..."

    @connect = connect()

    @options = _.defaults(opt,{
      root: root,
      config: "/config",
      controllers: "/controllers",
      views: "/views",
      models: "/models",
      public: "/public",
      template_engine: "jqtpl",
      port: 3000
    })

    pre = [connect.static("#{root}#{@options.public}"),connect.favicon()]

    @template_engines = {
      'jqtpl' : {
        'init' : ->
          return require('jqtpl');

        'render' : (template, tdata, callback) ->
          callback(null,engine.tmpl(template, tdata));
      }
    }

    console.log "Loading the configuration in #{@options.root}#{@options.config}..."

    configr = new Configr("#{@options.root}#{@options.config}")
    twister = new Twister()
    slicer = new Slicer()

    configr.on 'ready', => 
      twister.addRules configr.get().routes or []

      slicer.addSegmentIdentifier 'controller','index'
      slicer.addSegmentIdentifier 'action','index'

      this.emit 'ready'
      ready = true

      console.log "Base Framework is ready to accept requests!"

  addTemplateEngine: (name,def) ->
    @template_engines[name] = def

  getOptions: ->
    return @options

  _processRequest: (req,res,next) ->
    ifReady = =>
      if ready then return whenReady()
      process.nextTick ifReady

    process.nextTick ifReady

    whenReady = =>
      tdata = req.template or {}

      async.series(
        twister: (callback) =>
          twister.twist req.url, (twisted) =>
            req.url = twisted
            callback null

        splicer: (callback) =>
          sl = slicer.slice req.url
          req.controller = sl.controller
          req.action = sl.action
          req.params = sl.uri
          callback null

        controller: (callback) =>
          target = "#{@options.root}#{@options.controllers}/#{req.controller}.js"

          fs.stat target, (err) =>
            if (err) then return callback(null)

            callPreAction = (callback) => 
              if controller.pre_action
                controller.pre_action(req,res,callback);

              callback();

            callPostAction = =>
              if controller.post_action
                process.nextTick =>
                  controller.post_action(req)

            try
              controller = require target
              controller.getBase = => return this

              callPreAction ->
                method = req.method.toLowerCase()
                method_action = "#{req.action}_#{method}"

                if controller[method_action]
                  controller_action = controller["#{req.action}_#{method}"]

                else if controller[req.action]
                  controller_action = controller[req.action]

                controller_action req, res, (td) =>
                  tdata = _.extend tdata, td
                  callback null
                  process.nextTick callPostAction
            catch e
              console.log "Error loading controller:\n",e
              res.statusCode = 500
              return res.end "<h1>500 Internal Server Error</h1>"

        view: (callback) =>
          target = "#{@options.root}#{@options.views}/#{req.controller}/#{req.action}.#{@options.template_engine}"
          fs.readFile target, "utf8", (err,tmpdata) =>
            if (err)
              res.statusCode = 404
              return res.end "<h1>404 Not Found</h1>"

            tdata.controller    = req.controller;
            tdata.action        = req.action;
            tdata._layout       = tdata._layout or 'layout';

            target = "#{@options.root}#{@options.views}/#{tdata._layout}.#{@options.template_engine}"

            fs.readFile target, "utf8", (err,laydata) =>
              renderer tmpdata, tdata, (e,content) =>
                if err then return callback(null,content)

                tdata.content = content
                
                renderer laydata, tdata, (e,content) =>
                  callback(null,content)

      ,(err, data) =>
        if !res.getHeader('content-type') then res.setHeader("content-type", "text/html")
        res.end data.view
      )

  usePre: (module) ->
    pre.push(module)

  usePost: (module) ->
    post.push(module)

  go: ->

    engine = @template_engines[@options.template_engine].init()
    renderer = @template_engines[@options.template_engine].render

    while (pre.length) 
      @connect.use(pre.pop())

    @connect.use this.request()

    while (post.length) 
      @connect.use pre.pop()

    http.createServer(@connect).listen(@options.port);

    console.log "Application listening on port #{@options.port}"

  request: ->
    (req,res,next) => 
      this._processRequest req, res, next
  
  getConfig: -> configr.get()

module.exports = Base