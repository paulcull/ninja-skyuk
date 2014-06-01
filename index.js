//var SkyPlusNetwork = require('skyplus.js'),
var SkyPlusHD = require('sky-plus-hd'),
    util = require('util'),
    stream = require('stream'),
    http = require('http'),
    q = require('q'),
    https = require('https');
var configHandlers = require('./lib/config-handlers');
var messages = require('./lib/config-messages');
var skyDevice = require('./lib/device');


// ES: This code is horrid. Please fix it.
// If Elliot says it horrid then it is

// var log = console.log;
//var skyip = '192.168.1.43';
//var skyname = 'HOME';

util.inherits(driver,stream);
util.inherits(skyDevice,stream);


function driver(opts, app) {
  'use strict';
  this._app = app;
  this._opts = opts;

  this._devices = [];
  var self = this;

  app.once('client::up',function(){

    if (opts.skyip) {
      opts.config.skyip = opts.skyip;
      self.save();
    }

    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',messages.hello);
      opts.hasSentAnnouncement = true;
      self.save();
    }
    self.startScan(opts,app);
});

driver.prototype.startScan  = function(opts,app) {
  var deferred  =  q.defer();
  q.all([self.scan(opts,app)
    ]).then(function(foundIt) {
        //console.log(foundIt);
        app.log.info('(Sky Plus HD UK) : found skyHD at %s',foundIt[0].options.ip);
        opts.config.skyip = foundIt[0].options.ip;
    }).fail(function(err) {
        app.log.info('(Sky Plus HD UK) : could not find skyHD...waiting to try again');
        setTimeout(self.startScan(opts,app), 10000);
    });
};

driver.prototype.scan = function(opts, app) {

  var self = this;
  var deferred  =  q.defer();

  app.log.debug('(Sky Plus HD UK) : going to find skyHD');

    var skyFinder = new SkyPlusHD().find(opts);

  	skyFinder.then(function(skyBox) {
      opts.config.skyip = skyBox.options.ip;

  	  var _skyDevice = new skyDevice(opts, self._app, skyBox, self);
  	  self._devices.push(_skyDevice);

  	  Object.keys(_skyDevice.devices).forEach(function(id) {
  	    self._app.log.debug('(Sky Plus HD UK) : Adding sub-device', id, _skyDevice.devices[id].G);
  	    self.emit('register', _skyDevice.devices[id]);
  	    _skyDevice.devices[id].emit('data','');
  	  });

      //console.log('*&***** about to return: %s',skyBox);
      deferred.resolve(skyBox);
      //return true;

      app.log.debug('(Sky Plus HD UK) : Reading planner...');
      skyBox.planner.getPlannerItems().then(function(items) {
        app.log.info('(Sky Plus HD UK) : Planner contains '+items.length + ' items');
      });

  	});

    skyFinder.fail(function(err) {
      app.log.debug('(Sky Plus HD UK) : Failed to find skybox, '+err);
      skyFinder = null;
      deferred.reject(err);
      //return false;
    });

    return deferred.promise;

};

}

driver.prototype.config = function(rpc,cb) {
  'use strict';
  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // If its to rescan - just do it straight away
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,this._opts.config.skyip,cb);
  }
  else if (rpc.method === 'scan') {
    self._app.log.debug('(Sky Plus HD UK) : about to re-scan');
  this.scan(this._opts,this._app);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,this._opts,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};
module.exports = driver;
 

