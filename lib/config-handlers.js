var configMessages = require('./config-messages');

/** TODO use config to hold the device name string **/

/**
 * Called from the driver's config method when a
 * user wants to see a menu to configure the driver
 * @param  {Function} cb Callback to send a response back to the user
 */
exports.menu = function(opts_string_ip, cb) {
  var returnMenu = configMessages.menu;
  returnMenu.contents[2].value = opts_string_ip;
  cb(null,configMessages.menu);
};

/**
 * Called when a user clicks the 'submit'
 * button we sent in the menu request
 * @param  {Object}   params Parameter object
 * @param  {Function} cb     Callback to send back to the user
 */
exports.echo = function(opts,params,cb) {

  var echoText = params.echoText;
  var payloadToSend = configMessages.echo;
  opts.config.skyip = params.skyip;
  this.save();

  if (payloadToSend.contents[1]) {
      payloadToSend.contents[2].text = params.skyip;
  } else {
  	  // no response string
    payloadToSend.contents.push({ "type": "paragraph", "text": params.skyip });
	  payloadToSend.contents.push({ "type": "close"    , "name": "Close" });
  }

  cb(null,payloadToSend);
};

