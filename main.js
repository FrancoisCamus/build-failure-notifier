var http = require("http");
var fs = require("fs");
var gpio = require("pi-gpio");

var light = {
    pinId: 7,
    switchOn: function ()
    {   
        gpio.open(light.pinId, "output", function ()
        {
            gpio.write(light.pinId, 1); 
        });
    },
    switchOff: function ()
    {   
        gpio.close(light.pinId);
    },
    checkIfSwitchedOn: function (callback)
    {
        var pinFileName = "/sys/class/gpio/gpio" + 4 + "/value";
        
        fs.readFile(pinFileName, function (err, data)
        {
            if (!err)
            {
                callback();
            }
        });
    }
};

light.checkIfSwitchedOn(function ()
{
	light.switchOff();
});

var server = http.createServer(function (request, response) {

    request.on('data', function (data) {
     
        var json = JSON.parse(data.toString());

        console.log("Build phase: " + json.build.phase);
        console.log("Build status: " + json.build.status);
        console.log(data.toString());
        
        if (json.build.status === "FAILURE")
        {
            light.switchOn();
        }
        else
        {
            light.checkIfSwitchedOn(function ()
            {
                light.switchOff();
            });
        }
    });
    
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Request processed');

});

server.listen(8000);

server.on('close', function ()
{
    console.log('server closed');
    
    light.checkIfSwitchedOn(function ()
    {
        light.switchOff();
    });
});

server.on('error', function ()
{
    console.log('server error');
    
    light.checkIfSwitchedOn(function ()
    {
        light.switchOff();
    });
});

process.on('SIGINT', function ()
{
    console.log('process shutting down');
    
    light.checkIfSwitchedOn(function ()
    {
        light.switchOff();
    });
    
    process.exit();
});

console.log('Server running at http://127.0.0.1:8000/');