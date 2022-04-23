// Require Express.js
const express = require("express");

// Create app using express
const app = express();

// Create connection to database
const logdb = require("./database")

// Initialize args
const args = require("minimist")(process.argv.slice(2));

// Store help text 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

// Define arguments and set values
args["port"];
args["debug"];
args["log"];
const port = args.port || process.env.PORT || 5555;
const debug = args.debug || false;
const log = args.log || true;

// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port));
});

/*app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = `
        INSERT INTO accesslog
        (id,remote_addr,remote_user,datetime,method,url,http_version,status,content_length)
        VALUES (?,?,?,?,?,?,?,?,?);
    `;
    stmt.run(logdata.useragent,logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.httpversion, logdata.status, )
});*/

// Check endpoint
app.get('/app/', (req, res) => {
    // Respond with status 200
        res.statusCode = 200;
    // Respond with status message "OK"
        res.statusMessage = 'OK';
        res.writeHead(res.statusCode, { 'Content-Type' : 'text/plain' });
        res.end(res.statusCode+ ' ' +res.statusMessage)
});

if (debug) {
    // Log access endpoint
    app.get('/app/accesslog', (req, res) => {
        res.status(200);
    });

    // Error test endpoint
    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.');
    });
}

// Multiple flips endpoint
app.get('/app/flips/:number', (req, res) => {
    var num = parseInt(req.params.number);
    var flips = coinFlips(num);
    var count = countFlips(flips);
    var out = {raw: flips, summary: count};

    res.status(200).json(out);
});

// Single flip endpoint
app.get('/app/flip/', (req, res) => {
	const result = coinFlip();
    const out = {flip: result};

    res.status(200).json(out);
});

// Guess flip endpoint
app.get('/app/flip/call/:call', (req, res) => {
    const call = req.params.call;
    const out = flipACoin(call);

    res.status(200).json(out);
});

// Default endpoint
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND');
});


// Coin functions:
function coinFlip() {
    return Math.floor(Math.random() * 2) ? "heads" : "tails";
}

function coinFlips(flips) {
    var out = [];
    for (var i = 0; i < flips; i++) {
      out[i] = coinFlip();
    }
    return out;
}

function countFlips(array) {
    var headsCount = 0;
    var tailsCount = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] == "heads") {
            headsCount++;
        } else {
            tailsCount++;
        }
    }
    return {heads: headsCount, tails: tailsCount};
}

function flipACoin(call) {
    var flip = coinFlip();
    return {call: call, flip: flip, result: flip == call ? "win" : "lose"};
}