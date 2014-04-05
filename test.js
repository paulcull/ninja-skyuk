var opts = {};

var d = new (require('./index'))(opts, {
    on : function(x,cb){
        setTimeout(cb, 100);
    },
    once : function(x,cb){
        setTimeout(cb, 100);
    },
    log: {
        debug: console.log,
        info: console.log,
        warn: console.log,
        error: console.log
    },
    opts: {
        cloudHost : "zendo.ninja.is",
        apiHost : "api.ninja.is",
        streamHost : "stream.ninja.is"
    },
    token: 'XXX'
});

d.save = function() {
    console.log('NB:::::::Driver.save', opts);
};

d.on('register', function(value) {
    console.log('NB:::::::Driver.register');

    console.log('NB:::::::Registered device : ', value.name);
    var device = value;

    device.on('data', function(data) {
        if (typeof(data) === 'object') {
            var _data = JSON.stringify(data);
        } else {
            var _data = data;
        }
        console.log('NB:::::::Device "' + device.name + '" emitted data');
        console.log('NB:::::::Device "' + device.name + '" emitted data - ' + _data);
        console.log(JSON.stringify(data));
   });

    device.on('wrote', function(data) {
        console.log('NB:::::::Device "' + device.name + '" wrote data - ' + data);
   });

    setTimeout(function() {
        device.write('');
    }, 1000000);

});
