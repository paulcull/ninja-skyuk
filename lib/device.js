var stream = require('stream')
  , util = require('util');

// Give our device a stream interface
util.inherits(Device,stream);

module.exports = Device;

function Device(opts, app, skyBox, emitter) {

  var self = this;

  this.app = app;
  this.host = skyBox.details.modelName;
  this.name = skyBox.details.manufacturer + ' - ' + skyBox.details.modelName;

  var skyIconURL = 'http://tv.sky.com/logo/300/75/skychb';

  player = skyBox;

  ////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////
  
  //console.log('start listening for states')
  // set subscriptions to each of the events
  // these events are captured in the squeezeplayer.js controller in the sky-plus-hd node_module
  'stateChanged'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s',eventName);
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s: %s',eventName, JSON.stringify(e));

      //console.log('e for %s is this: %s',eventName, e);
      // set play states based on the event
      var _mode = 'stop';
      var _on = e.TransportState=="STOPPED" ? false : true;
      var _play = e.TransportState=="PLAYING" ? true : false;
      var _normal_speed = e.TransportPlaySpeed==1 ? true : false;
      var _pause = e.TransportState=="PAUSED_PLAYBACK" ? true : false;
      var _next_mode = '';

      if (_play&&_normal_speed) {_mode = 'play';_next_mode = 'pause'};
      if (!_normal_speed) {_mode = 'search';_next_mode = 'play'}
      if (_pause) {_mode = 'pause';_next_mode = 'play'};

      // if switched off - reset everything
      if (!_on) {
        //console.log('switching off...');
        self.devices.mediaObject._data.state.track_id = null;
        self.devices.mediaObject._data.state.volume = 0;
        self.devices.mediaObject._data.state.position = null;
        self.devices.mediaObject._data.state.state = "off";
        self.devices.mediaObject._data.track.duration = 0;
        self.devices.mediaObject._data.state.mode = _mode;
        self.devices.mediaObject._data.state.mode_speed = e.TransportPlaySpeed;  
        self.devices.mediaObject._data.state.mode_status = e.TransportStatus;     
        self.devices.mediaObject._data.state.nextmode = _next_mode;
        self.devices.mediaObject._data.track.name = 'Sky+ is off';
        self.devices.mediaObject._data.track.desc = '';        
        self.devices.mediaObject._data.track.artist = '';
        self.devices.mediaObject._data.track.album = '';
        self.devices.mediaObject._data.track.disc_number = '';
        self.devices.mediaObject._data.track.track_number = '';
        self.devices.mediaObject._data.track.id = '';
        self.devices.mediaObject._data.state.track_id = '';
        self.devices.mediaObject._data.track.album_artist = null;
        self.devices.mediaObject._data.track.squeeze_url = null;
        self.devices.mediaObject._data.image = 'noton';
        //  self.devices.mediaObject.write('data',self.devices.mediaObject._data)

      } else {

        self.devices.mediaObject._data.state.state = 'on';
        self.devices.mediaObject._data.state.mode = _mode;
        self.devices.mediaObject._data.state.mode_speed = e.TransportPlaySpeed;
        self.devices.mediaObject._data.state.mode_status = e.TransportStatus;     
        self.devices.mediaObject._data.state.nextmode = _next_mode;

      }

      self.app.log.debug('(Sky Plus HD UK) : about to send %s media object for %s...',eventName, self.name);
      //console.log(JSON.stringify(self.devices.mediaObject._data));
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);

    });
  });

  'channel','channelChanged'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s',eventName);
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s: %s',eventName, JSON.stringify(e));

      //store the channel details for when it's switched on
      self.devices.mediaObject._data.state.track_id = e.id;
      self.devices.mediaObject._data.track.name = e.nameLong;
      self.devices.mediaObject._data.track.desc = 'Sky+ Live TV';
      self.devices.mediaObject._data.track.artist = this.name;
      self.devices.mediaObject._data.track.album = e.name;
      self.devices.mediaObject._data.track.track_number = e.number;
      self.devices.mediaObject._data.track.id = e.id;
      self.devices.mediaObject._data.track.squeeze_url = null;
      self.devices.mediaObject._data.image = skyIconURL + e.id + '.png';

      //only send it out if the box is on
      if (self.devices.mediaObject._data.state.state ==='on') {

        self.app.log.debug('(Sky Plus HD UK) : about to send %s media object for %s...',eventName, self.name);
        //console.log(JSON.stringify(self.devices.mediaObject._data));
        self.devices.mediaObject.emit('data',self.devices.mediaObject._data)

      } else {

        self.app.log.debug('(Sky Plus HD UK) : Not sending channel as device is off');

      };

    });
  });

  'video'
  .split(',').forEach(  function listenToNotification(eventName) {
    player.on(eventName, function(e) {
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s',eventName);
      self.app.log.debug('(Sky Plus HD UK) : Got Event %s: %s',eventName, JSON.stringify(e));
      // self.devices.mediaObject._data.state.track_id = e.id;
      self.devices.mediaObject._data.track.name = e.title;
      self.devices.mediaObject._data.track.artist = this.name;
      self.devices.mediaObject._data.track.desc = e.description;
      self.devices.mediaObject._data.track.album = e.channel.name;
      self.devices.mediaObject._data.track.track_number = e.resource;
      self.devices.mediaObject._data.track.id = e.id;
      self.devices.mediaObject._data.track.squeeze_url = null;
      self.devices.mediaObject._data.image = skyIconURL + e.channel.id + '.png';

      self.app.log.debug('(Sky Plus HD UK) : about to send %s media object for %s...',eventName, self.name);
      // console.log(JSON.stringify(self.devices.mediaObject._data));
      self.devices.mediaObject.emit('data',self.devices.mediaObject._data);

    });
  });

  ////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////

  // set the core media object
  // this is used for communicating with the ninja block services
  function mediaObject() {
    this.readable = true;
    this.writeable = false;
    this.V = 0;
    this.D = 280;
    this.G = 'skyHD'+skyBox.options.ip.replace(/[^a-zA-Z0-9]/g, '');
    this.name = skyBox.details.manufacturer + ' - ' + skyBox.details.modelName +' - MediaObject';
    this._features = {
      "play":true,
      "pause":true,
      "rew":true,
      "ffd":true,
      "onoff":false,
      "volup":false,
      "voldown":false 
    },
    this._data = {
      "state":{
        "player_name":skyBox.details.modelName,
        "track_id":"",
        "volume":0,
        "position":0,
        "state":"off",
        "mode":"off",
        "mode_speed":0,
        "mode_status":"",
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
        "desc":"",
        "album_artist":"",
        "spotify_url":"",
        "season":"",
        "episode":""
      },
      "image":"."
    };
    self.app.log.debug('Sky Plus HD UK - media object [%s] being created.', this.G);    
  }
  util.inherits(mediaObject, stream);

  mediaObject.prototype.write = function(data) {
    self.app.log.debug('Sky Plus HD UK - media object command received for %s : %s', this.G, JSON.stringify(data));
    if (data.command) {
      switch(data.command)
      {
      case 'onoff':
        self.app.log.debug('Sky Plus HD UK - Toggle on/off - NOT IMPLEMENTED');
        // if (self.devices.mediaObject._data.state.state === 'off') {
        //   player.switchOn();
        // } else {
        //   player.switchOff();
        // }
        break;
      case 'chup':
        self.app.log.debug('Sky Plus HD UK - Channel Up');
        player.ch_up();
        break;
      case 'chdn':
        self.app.log.debug('Sky Plus HD UK - Channel Down');
        player.ch_down();
        break;
      case 'fwd':
        self.app.log.debug('Sky Plus HD UK - Jump Forward');
        player.fwd();
        break;
      case 'rew':
        self.app.log.debug('Sky Plus HD UK - Jump Rewind');
        player.rew();
        break;
      case 'playPause':
        self.app.log.debug('Sky Plus HD UK - Play Pause');
        if (self.devices.mediaObject._data.state.mode === 'pause') {
          player.play();
        } else {
          player.pause();
        }
      }
    };
    //self._app.log.debug('see the image at %s',self.devices.mediaObject._data.image);
    return true;
  };

  // These are the devices created from device types

  this.devices = {
    mediaObject: new mediaObject()
  };
}


// a couple of helpers

function startsWith(search, s) {
    return s.substr(0,search.length) == search;
}

Device.prototype.end = function() {};
Device.prototype.close = function() {};


