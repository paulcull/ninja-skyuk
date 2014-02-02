//var SkyPlusNetwork = require('skyplus.js'),
var SkyPlusHD = require('sky-plus-hd'),
    util = require('util'),
    stream = require('stream'),
    http = require('http'),
    https = require('https');
var configHandlers = require('./lib/config-handlers');
var messages = require('./lib/config-messages');
//var q = require('q');


// ES: This code is horrid. Please fix it.
// If Elliot says it horrid then it is

// var log = console.log;
var skyip = 'localhost';
var skyname = 'HOME';
var enabled = true;

util.inherits(driver,stream);
util.inherits(skyDevice,stream);


function driver(opts, app) {

if (!enabled) {
  app.log.info('(Sky Plus HD UK) Sky Plus HD UK driver is disabled');
}

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

    var skyFinder = new SkyPlusHD().find();

    skyFinder.then(function(skyBox) {
      console.log("READY: "+skyBox.description);
      //self.add(opts,skyBox);

      console.log('before _skyDevice');
      var _skyDevice = new skyDevice(opts, self._app, skyBox);
      console.log('got _skyDevice');
      self._devices.push(_skyDevice);
      console.log(JSON.stringify(_skyDevice.devices));

      // Object.keys(_skyDevice.devices).forEach(function(id) {
      //   self._app.log.debug('(Sky Plus HD UK) : Adding sub-device', id, _skyDevice.devices[id].G);
      //   self.emit('register', _skyDevice.devices[id]);
      //   _skyDevice.devices[id].emit('data','');
      // });

      console.log("Reading planner...");
      skyBox.planner.getPlannerItems().then(function(items) {
        console.log('Planner contains '+items.length + ' items');
      });

    });
    //
    skyFinder.fail(function(err) {
       console.log("Failed to find skybox, "+err);
    });

  });
  //
}

driver.prototype.config = function(rpc,cb) {

  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // If its to rescan - just do it straight away
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,this._opts.skyip,this._opts.skyname,this._opts.remote_url,this._opts.enabled,cb);
  }
  else if (rpc.method === 'scan') {
    self._app.log.debug('(Sky Plus HD UK) : about to re-scan');
    this.scan(opts,app);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,this._opts,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};


module.exports = driver;

//function skyDevice(opts, app, skyBox, emitter) {
function skyDevice(opts, app, skyBox) {

  var self = this;

  console.log('creating the devices');
  console.log(skyBox.details.manufacturer);  

  this.app = app;
  this.host = skyBox.details.modelName;
  this.name = skyBox.details.manufacturer + ' ' + skyBox.details.modelName;

  //console.log(JSON.stringify(skyBox));

  player = skyBox;

  // set subscriptions to each of the events
  // these events are captured in the squeezeplayer.js controller in the sky-plus-hd node_module
  'stateChanged,channel'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s',eventName);
      var playEvent = e;
      console.log(util.format(">->->- State:[%s] URI:[%s] Speed:[%s]",playEvent.TransportState,playEvent.CurrentTrackURI,playEvent.TransportPlaySpeed));      
      //player.monitor();
      console.log(JSON.stringify(e));
      //console.log(skyBox);
      //self.devices.displayProp.emit('data', eventName+':'+e);
      // ask for the current song any time we don't know what's happened
      // player.getPlayerSong();

    });
  });

  function mediaObject() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 280;
    this.G = 'skyHD'+skyBox.options.ip.replace(/[^a-zA-Z0-9]/g, '');
    this.name = skyBox.description.modelName+' - MediaObject';
    this._data = {
      "state":{
        "track_id":"",
        "volume":0,
        "position":0,
        "state":"off",
        "mode":"off",
        "nextmode":"-"
      },
      "track":{
        "artist":"",
        "album":"",
        "disc_number":0,
        "duration":0,
        "played_count":0,
        "track_number":0,
        "starred":false,
        "popularity":0,
        "id":"",
        "name":"",
        "album_artist":"",
        "spotify_url":"",
        "season":"",
        "episode":""
      },
      "image":"."
    };
    self.app.log.debug('Sky Plus HD UK - media object [%s] being created : %s', this.G, JSON.stringify(data));    
  }
  util.inherits(mediaObject, stream);

  // mediaObject.prototype.write = function(data) {
  //   self.app.log.debug('Sky Plus HD UK - media object command received for %s : %s', this.G, JSON.stringify(data));
  //   // if (data.command) {
  //   //   switch(data.command)
  //   //   {
  //   //   case 'onoff':
  //   //     self.app.log.debug('Sky Plus HD UK - Toggle on/off');
  //   //     // if (self.devices.mediaObject._data.state.state === 'off') {
  //   //     //   player.switchOn();
  //   //     // } else {
  //   //     //   player.switchOff();
  //   //     // }
  //   //     break;
  //   //   case 'fwd':
  //   //     self.app.log.debug('Sky Plus HD UK - Jump Forward');
  //   //     // player.jumpfwd();
  //   //     break;
  //   //   case 'rew':
  //   //     self.app.log.debug('Sky Plus HD UK - Jump Rewind');
  //   //     // player.jumprew();
  //   //     break;
  //   //   case 'playPause':
  //   //     self.app.log.debug('Sky Plus HD UK - Play Pause');
  //   //     // if (self.devices.mediaObject._data.state.mode === 'pause') {
  //   //     //   player.command('play');
  //   //     // } else {
  //   //     //   player.command('pause');
  //   //     // }
  //   //   }
  //   // };
  //   //self._app.log.debug('see the image at %s',self.devices.mediaObject._data.image);
  //   //self._xbmc.message(data);
  //   return true;
  // };

  // These are the devices created from device types

  this.devices = {
    mediaObject: new mediaObject()
  };
}


// a couple of helpers

function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

skyDevice.prototype.end = function() {};
skyDevice.prototype.close = function() {};


