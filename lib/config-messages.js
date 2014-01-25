exports.menu = {
  "contents":[
    { "type": "paragraph", "text": "Welcome to the Sky Plus UK PVR driver."},
    { "type": "paragraph", "text": "Please enter the IP address of the SKY Plus box as well a nickname and remote url"},
    { "type": "input_field_text", "field_name": "skyip", "value": "", "label": "IP Address", "required": true},
    { "type": "input_field_text", "field_name": "skyname", "value": "", "label": "SName", "required": true},
    { "type": "input_field_text", "field_name": "remote_url", "value": "", "label": "Remote Coverart URL", "required": true},
    { "type": "input_field_boolean", "field_name": "enabled", "value": "", "label": "Enabled", "required": true},
    { "type": "submit", "name": "Save Server details", "rpc_method": "echo" },
  ]
};

exports.echo = {
  "contents":[
    { "type": "paragraph", "text": "You have stored the settings below in your config"},
    { "type": "paragraph", "text": "IP: "},
    { "type": "paragraph", "text": "Name: "},    
    { "type": "paragraph", "text": "Coverart URL: "},    
    { "type": "paragraph", "text": "Enabled: "},    
    { "type": "paragraph", "text": "Click Scan below to rescan the server"},
    { "type": "submit", "name": "Re-Scan", "rpc_method": "scan" },
    { "type": "close", "name": "Close", "rpc_method": "close" },
  ]
};

exports.hello = {
  "contents": [
    { "type": "heading",      "text": "SKY Plus UK driver Loaded" },
    { "type": "paragraph",    "text": "The SKY Plus UK driver has been loaded. You should not see this message again." }
  ]
};