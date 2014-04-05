//var SkyPlusNetwork = require('skyplus.js'),
var SkyPlusHD = require('sky-plus-hd'),
    util = require('util'),
    stream = require('stream'),
    http = require('http'),
    https = require('https');
var configHandlers = require('./lib/config-handlers');
var messages = require('./lib/config-messages');
var skyDevice = require('./lib/device');


// ES: This code is horrid. Please fix it.
// If Elliot says it horrid then it is

// var log = console.log;
var skyip = '192.168.1.43';
//var skyname = 'HOME';

util.inherits(driver,stream);
util.inherits(skyDevice,stream);


function driver(opts, app) {

  this._app = app;
  this._opts = opts;

  this._devices = [];
  var self = this;

  app.once('client::up',function(){

    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',messages.hello);
      opts.hasSentAnnouncement = true;
      self.save();
    }
    if (!opts.skyip) {
      opts.skyip = skyip;
      self.save(); 
    }

    self.scan(opts,app);


  });
  //
}

driver.prototype.scan = function(opts, app) {

  var self = this;
	console.log('going to find skyHD');
	var skyFinder = new SkyPlusHD().find(opts.skyip);

	skyFinder.then(function(skyBox) {
	  console.log("READY: "+skyBox.description);
	  //self.add(opts,skyBox);


	  console.log('before _skyDevice');

	  var _skyDevice = new skyDevice(opts, self._app, skyBox, self);
	  // console.log(' ***** got _skyDevice');
	  // console.log(JSON.stringify(_skyDevice));
	  self._devices.push(_skyDevice);
	  // console.log('these are the devices');
	  // console.log(JSON.stringify(_skyDevice.devices));

	  Object.keys(_skyDevice.devices).forEach(function(id) {
	    self._app.log.debug('(Sky Plus HD UK) : Adding sub-device', id, _skyDevice.devices[id].G);
	    self.emit('register', _skyDevice.devices[id]);
	    _skyDevice.devices[id].emit('data','');
	  });

	  console.log("Reading planner...");
	  skyBox.planner.getPlannerItems().then(function(items) {
	    console.log('Planner contains '+items.length + ' items');
	  });

	  //}).done();

	});

	skyFinder.fail(function(err) {
	   console.log("Failed to find skybox, "+err);
	});


};

driver.prototype.config = function(rpc,cb) {

  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // If its to rescan - just do it straight away
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    //return configHandlers.menu.call(this,this._opts.skyip,this._opts.skyname,this._opts.remote_url,this._opts.enabled,cb);
    return configHandlers.menu.call(this,cb);
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
 

