var configMessages = require('./config-messages');

/** TODO use config to hold the device name string **/

/**
 * Called from the driver's config method when a
 * user wants to see a menu to configure the driver
 * @param  {Function} cb Callback to send a response back to the user
 */
exports.menu = function(opts_string_ip, opts_string_name, opts_string_remote_url, opts_flag_enabled, cb) {
  var returnMenu = configMessages.menu;
  returnMenu.contents[2].value = opts_string_ip;
  returnMenu.contents[3].value = opts_string_name;
  returnMenu.contents[4].value = opts_string_remote_url;
  returnMenu.contents[5].value = opts_flag_enabled;
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
  opts.skyip = params.skyip;
  opts.skyname = params.skyname;
  opts.remote_url = params.remote_url;
  opts.enabled = params.enabled;
  this.save();

  if (payloadToSend.contents[1]) {
      payloadToSend.contents[1].text = params.skyip;
      payloadToSend.contents[1].text = params.skyname;
      payloadToSend.contents[1].text = params.remote_url;
      payloadToSend.contents[1].text = params.enabled;
  } else {
  	  // no response string
    payloadToSend.contents.push({ "type": "paragraph", "text": params.skyip });
    payloadToSend.contents.push({ "type": "paragraph", "text": params.skyname });
    payloadToSend.contents.push({ "type": "paragraph", "text": params.remote_url });
    payloadToSend.contents.push({ "type": "paragraph", "text": params.enabled });
	  payloadToSend.contents.push({ "type": "close"    , "name": "Close" });
  }

  cb(null,payloadToSend);
};
