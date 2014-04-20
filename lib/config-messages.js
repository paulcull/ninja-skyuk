exports.menu = {
  "contents":[
    { "type": "paragraph", "text": "Welcome to the Sky Plus UK PVR driver."},
    { "type": "paragraph", "text": "Please enter the IP address of the SKY Plus box as well a nickname and remote url"},
    { "type": "input_field_text", "field_name": "skyip", "value": "", "label": "IP Address", "required": true},
    { "type": "submit", "name": "Save Server details", "rpc_method": "echo" },
    { "type": "submit", "name": "Scan for Sky Box", "rpc_method": "scan" },
  ]
};

exports.echo = {
  "contents":[
    { "type": "paragraph", "text": "You have stored the settings below in your config"},
    { "type": "paragraph", "text": "IP: "},
    { "type": "heading", "text": "Click Scan below to rescan for Sky+"},
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