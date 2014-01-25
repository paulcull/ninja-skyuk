var SkyBox = require('skyplus'),
    util = require('util'),
    stream = require('stream'),
    http = require('http'),
    https = require('https');
    configHandlers = require('./lib/config-handlers');
    messages = require('./lib/config-messages');

// ES: This code is horrid. Please fix it.
// If Elliot says it horrid then it is

var log = console.log;
var skyip = 'localhost';
var skyname = 'HOME';
var enabled = true;

util.inherits(driver,stream);
util.inherits(skyDevice,stream);


function driver(opts, app) {

if (!enabled) {
  app.log.info('(Sky Plus UK) Sky Plus UK driver is disabled');
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
    if (!opts.skyip) {
      opts.skyip = skyip;
      self.save(); 
    }
    if (!opts.skyname) {
      opts.skyname = skyname;
      self.save();
    }
    if (!opts.remote_url) {
      opts.remote_url = remote_url;
      self.save();
    }

    self._app.log.info('(Sky Plus UK) Scanning with options %s...',JSON.stringify(opts));
    //self.scan(opts.skyip,opts.skyname,app);
    self.scan(opts,app);
    self._devices.forEach(function(player) {
      self._app.log.debug('(Sky Plus UK) : going to lister  on player %s', player.id);      
      player.on("logitech_event", function(p) {
        self._app.log.debug('(Sky Plus UK) : logitech_event player num %s with event %s', player.id,p);      
      });
    });
  });
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
    self._app.log.debug('(Sky Plus UK) : about to re-scan');
    this.scan(opts,app);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,this._opts,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};


driver.prototype.scan = function(opts, app) {

  var self = this;
  this.host = opts.skyip;
  this.name = opts.skyname && opts.skyname.length > 0? opts.skyname : opts.skyip;
  this.app = app;

  self._app.log.debug('(Sky Plus UK) : Creating connection to Logitech Media Server Host for %s at host %s', this.name, this.host);
  var sky = new LogitechMediaServer(this.host);

  sky.on("registration_finished", function() {

    var playerCount = Object.keys(sky.players).length;
    self._app.log.debug('(Sky Plus UK) : Connection completed to Logitech Media Server Host, found %s players', playerCount);
    Object.keys(sky.players).forEach(function(data){
      self._app.log.debug('(Sky Plus UK) : Logitech player found at %s, adding to collection', data.toUpperCase());
      self.add(opts, sky, data);
      self._app.log.debug('(Sky Plus UK) : Logitech player found at %s, now added', data.toUpperCase());
    })
  });
  //Start up the sky scanner
  sky.start();
};

driver.prototype.add = function(opts, sky, mac) {
  var self = this;
  var _skyDevice = new skyDevice(opts, self._app, sky, mac, self);
  // var _skyDevice = new skyDevice(host, sky.players[mac].name, self._app, sky, mac);
  self._devices.push(_skyDevice);

  // These need to get added under the name event once the player is up
  // this allows us to name the devices properly
  //
  // Object.keys(_skyDevice.devices).forEach(function(id) {
  //   self._app.log.debug('(Sky Plus UK) : Adding sub-device',host, id, _skyDevice.devices[id].G);
  //   self.emit('register', _skyDevice.devices[id]);
  // });
};

module.exports = driver;

function skyDevice(opts, app, sky, mac, emitter) {

  var self = this;
  //self.name = name.toUpperCase()+':'+mac;
  self.mac = mac;

  this.app = app;
  this.host = opts.skyip;
  this.name = opts.skyname;

  // set this collection of devices to a unique Sky Plus UK
  player = sky.players[mac];

  // set subscriptions to each of the events
  // these events are captured in the squeezeplayer.js controller in the logitechmediaserver node_module
  'logitech_event,property'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //self.devices.displayProp.emit('data', eventName+':'+e);
      // ask for the current song any time we don't know what's happened
      // player.getPlayerSong();

    });
  });

  //name is what it says - name of the player
  'name'
  .split(',').forEach(  function listenToNotification(eventName) {
    //self.app.log.debug('listening to %s on %s',eventName,mac.toUpperCase());
    player.on(eventName, function(e) {
      if (self.name != e) {
        Object.keys(self.devices).forEach(function(id) {
          self.app.log.debug('(Sky Plus UK) : Adding sub-device',this.host, self.devices[id]._name, id, self.devices[id].G);
          self.devices[id].name = self.name+self.devices[id]._name;
          //self.app.log.debug('(Sky Plus UK) : Device is %s', JSON.stringify(self.devices[id]));
          emitter.emit('register', self.devices[id]);
          self.name = e;

        });
        player.getPlayerSong();
      } else
      { 
          self.app.log.debug('In this part of the code for sky - I shouldnt be here');
      }
      //self.devices.displayName.emit('name',e);
      //self.devices.displayName.emit('data', 'name is '+e);

      // push back into the driver part, but wait for the names to be collected before trying to udpate anything

    });
  });

  //songinfo has all the track details
  'songinfo,song_details'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Sky Plus UK) : Got %s in ninja',eventName);
      //self.app.log.debug('(Sky Plus UK) : Using these options: %s',JSON.stringify(opts));
      
      self.devices.mediaObject._data.track.name = e.title;
      self.devices.mediaObject._data.track.artist = e.artist;
      self.devices.mediaObject._data.track.album = e.album;
      self.devices.mediaObject._data.track.disc_number = e.disc;
      self.devices.mediaObject._data.track.track_number = e.tracknum;
      self.devices.mediaObject._data.track.duration = e.duration;
      self.devices.mediaObject._data.track.id = e.id;
      self.devices.mediaObject._data.state.track_id = e.id;
      self.devices.mediaObject._data.track.album_artist = e.artist;
      self.devices.mediaObject._data.track.squeeze_url = e.file;
      self.devices.mediaObject._data.image = 'http://' + opts.remote_url + ':9000/music/' + e.coverid + '/cover_375x375_p.jpg';

      self.app.log.debug('(Sky Plus UK) : about to send media object for %s...',opts.skyname);
      // uncomment to see the media object being sent
     // self.app.log.debug('(Sky Plus UK) : object : %s',JSON.stringify(self.devices.mediaObject._data));
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
      //self.devices.coverArt.write(e);
    });
  });

  //playlist tells us the track has changed - we only listen to playlist open
  //and then trigger us to get the track details
  'playlist'
  .split(',').forEach(  function listenToNotification(eventName) {
    _lastevent = '';
    player.on(eventName, function(e) {
      if (e != _lastevent) {
        if (e === 'playlist pause 0') {
          //self.devices.displayPlay.emit('data', 'playlist is '+e);
        } else if (startsWith("playlist newsong", e)) {
          self.app.log.debug('(Sky Plus UK) : Playlist song');
          player.getPlayerSong();
        } else if (startsWith("playlist open", e)) {
          self.app.log.debug('(Sky Plus UK) : New Playlist');
          var mediaFileName = e.substr(14,(e.length-14));
          //console.log('*** about to get playlist openfile songinfo for %s', mediaFileName);
          player.getSongInfo(mediaFileName);
        } else {
          console.log('**** nb emit logitech playlist on %s for %s with value %s',mac.toUpperCase()+'-*-'+self.name,eventName,e);
          //self.devices.mediaObject._data.state.track_id = e;
          //self.devices.mediaObject.emit('data',self.devices.mediaObject._data)
          //self.devices.displayPlay.emit('data', 'playlist is '+e);
        }
        }
    });
  });

  // this is the path for the track
  'song_path,path'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //self.app.log.debug('**** nb emit logitech path for %s with value %s',eventName,JSON.stringify(e));
      self.app.log.debug('(Sky Plus UK) : Got Event %s with filename %s',eventName,e.file);
      player.getSongInfo('file:'+e.file);
    });
  });

  // this is the playing mode
  'mode'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //self.app.log.debug('**** nb emit logitech path for %s with value %s',eventName,JSON.stringify(e));
      self.app.log.debug('(Sky Plus UK) : Got Event %s with mode as %s',eventName,e);
      self.devices.mediaObject._data.state.mode = e
      if (e === 'play') {
        self.devices.mediaObject._data.state.nextmode = 'Pause'
        if (self.devices.mediaObject._data.state.state === 'off') {
          self.devices.mediaObject._data.state.nextmode = '-'
        } 
      } else {
        console.log('not in play');
        self.devices.mediaObject._data.state.nextmode = 'Play'          
      }
      self.app.log.debug('(Sky Plus UK) : about to send media object for %s...',opts.skyname);
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
      //player.getSongInfo('file:'+e.file);
    });
  });

  // does what it says
  'volume'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.devices.mediaObject._data.state.volume = player.getNoiseLevel();
      self.app.log.debug('(Sky Plus UK) : about to send media object for %s...',opts.skyname);      
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
      self.app.log.debug('(Sky Plus UK) : Volumes is %s',self.devices.mediaObject._data.state.volume);
      //self.devices.soundVolume.emit('data',player.getNoiseLevel());
      //self.devices.mediaObject.write('data',self.devices.mediaObject._data)
    });
  });

  // set subscriptions to each of the events
  'power'//State,power'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      //console.log('e for %s is this: %s',eventName, e);
      var _state = e==1 ? 'on' : 'off';
      //console.log('old is %s : new is %s',e,_state);
      self.app.log.debug('(Sky Plus UK) : Power old is %s : new is %s',e,_state);
      // if switched off - reset everything
      if (!e) {
        console.log('switching off...');
        self.devices.mediaObject._data.state.track_id = null;
        self.devices.mediaObject._data.state.volume = 0;
        self.devices.mediaObject._data.state.position = null;
        self.devices.mediaObject._data.state.state = "off";
        self.devices.mediaObject._data.track.duration = 0;
        self.devices.mediaObject._data.state.mode = "off"
        self.devices.mediaObject._data.state.nextmode = "-"

        self.devices.mediaObject._data.track.name = 'Player is off';
        self.devices.mediaObject._data.track.artist = '';
        self.devices.mediaObject._data.track.album = '';
        self.devices.mediaObject._data.track.disc_number = '';
        self.devices.mediaObject._data.track.track_number = '';
        self.devices.mediaObject._data.track.id = '';
        self.devices.mediaObject._data.state.track_id = '';
        self.devices.mediaObject._data.track.album_artist = null;
        self.devices.mediaObject._data.track.squeeze_url = null;
        self.devices.mediaObject._data.image = 'null';

        self.app.log.debug('(Sky Plus UK) : about to send media object for %s...',opts.skyname);
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data);
        //  self.devices.mediaObject.write('data',self.devices.mediaObject._data)
        //self.devices.coverArt.write(e);

       } else {
        self.devices.mediaObject._data.state.state = 'on';
        self.devices.mediaObject._data.state.volume = player.getNoiseLevel()
       player.getPlayerSong();

       }
      //console.log('about to send media object with %s',self.devices.mediaObject._data);
      //self.devices.powerState.emit('data',_state);
    });
  });


  function displayText(qual) {
    this.readable = true;
    this.writeable = false;
    this.qual = qual;
    this.V = 0;
    this.D = 240;
    //this.G = self.mac;
    this.G = 'skyD'+qual+''+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this._name = ' - Text ['+qual+']';
  }
  util.inherits(displayText, stream);
  displayText.prototype.write = function(data) {
    self._app.log.debug('Sky Plus UK - received text to display for %s : %s', this.G, data);
    //self._xbmc.message(data);
    return true;
  };

  function mediaObject() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 280;
    this.G = 'skyMO'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    //this.G = self.mac;
    this._name = ' - MediaObject';
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
        "spotify_url":""
      },
      "image":"."
    };
//    console.log(this._data);
  }
  util.inherits(mediaObject, stream);
  mediaObject.prototype.write = function(data) {
    self.app.log.debug('Sky Plus UK - media object command received for %s : %s', this.G, JSON.stringify(data));
    if (data.command) {
      switch(data.command)
      {
      case 'onoff':
        self.app.log.debug('Sky Plus UK - Toggle on/off');
        if (self.devices.mediaObject._data.state.state === 'off') {
          player.switchOn();
        } else {
          player.switchOff();
        }
        break;
      case 'volup':
        self.app.log.debug('Sky Plus UK - Volume Up');
        player.volup();
        break;
      case 'voldown':
        self.app.log.debug('Sky Plus UK - Volume Down');
        player.voldown();
        break;
      case 'fwd':
        self.app.log.debug('Sky Plus UK - Jump Forward');
        player.jumpfwd();
        break;
      case 'rew':
        self.app.log.debug('Sky Plus UK - Jump Rewind');
        player.jumprew();
        break;
       case 'playPause':
        self.app.log.debug('Sky Plus UK - Play Pause');
        if (self.devices.mediaObject._data.state.mode === 'pause') {
          player.play();
        } else {
          player.pause();
        }
      }
    }
    //self._app.log.debug('see the image at %s',self.devices.mediaObject._data.image);
    //self._xbmc.message(data);
    return true;
  };

  function camera(host) {
    this.writeable = true;
    this.readable = true;
    this.playerName = self.mac;
    this.V = 0;
    this.D = 1004;
    //this.G = self.mac;
    this.G = 'skyD'+self.mac.replace(/[^a-zA-Z0-9]/g, '');
    this._guid = [self.app.id,this.G,this.V,this.D].join('_');
    this._name = " - Cover Art Viewer";
    this.host = host;
  }
  util.inherits(camera, stream);
  camera.prototype.write = function(data) {
//  camera.prototype.write = function() {
    // self._app.log.debug('Sky Plus UK - received camera for %s : %s', this.G, data);
    // self._app.log.debug('see the image at %s',self.devices.mediaObject._data.image);
    //console.log('see the image at %s',self.devices.mediaObject._data.image);
  console.log('Sky Plus UK - received camera for %s : %s', this.G, JSON.stringify(data));

    var postOptions = {
      host:self.app.opts.streamHost,
      port:self.app.opts.streamPort,
      // host:skyip,
      // port:9000,
      path:'/rest/v0/camera/'+this._guid+'/snapshot',
      method:'POST'
    };

    //console.log(JSON.stringify(postOptions));

    var proto = (self.app.opts.streamPort==443) ? https:http;

    //console.log('Requesting current playing');

// //          var thumbnail = "http://" + this.host + ':9000/music/' + encodeURIComponent(songId) + '/cover.jpg';
           var thumbnail = self.devices.mediaObject._data.image;

           console.log('Sending thumbnail : ' + thumbnail);

          var getReq = http.get(self.devices.mediaObject._data.image,function(getRes) {

  
            postOptions.headers = {

              'Content-Type' : 'image/jpeg'
              , 'Expires' : 'Mon, 3 Jan 2000 12:34:56 GMT'
              , 'Pragma' : 'no-cache'
              , 'transfer-encoding' : 'chunked'
              , 'Connection' : 'keep-alive'
              , 'X-Ninja-Token' : self.app.token
            };
            //postOptions.headers = getRes.headers;
            //postOptions.headers['X-Ninja-Token'] = self.app.token;
            //console.log('token', self.app.token);

            var postReq = proto.request(postOptions,function(postRes) {

              postRes.on('end',function() {
                //console.log('Stream Server ended');
              });
              postRes.resume();
            });

            postReq.on('error',function(err) {
              console.log('Error sending picture: ');
              console.log(err);
            });

            var lenWrote=0;
            getRes.on('data',function(data) {
              postReq.write(data,'binary');
              lenWrote+=data.length;
            });

            getRes.on('end',function() {
              postReq.end();
              console.log("Image sent %s",lenWrote);
            });
            getRes.resume();
          });
          getReq.on('error',function(error) {
            console.log(error);
          });
          getReq.end();

        //});

    return true;
  };

// These are the devices created from device types

  this.devices = {
    //hid: new hid(),
    // soundVolume: new soundVolume(),
    // powerState: new switchState(),
    // displayName: new displayText('name'),
    // displayPlay: new displayText('play'),
    coverArt: new camera(opts.skyip),
    // displayProp: new displayText('prop'),
    mediaObject: new mediaObject()
  };
  //console.log(JSON.stringify(this.devices));
}


// a couple of helpers

function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

skyDevice.prototype.end = function() {};
skyDevice.prototype.close = function() {};


