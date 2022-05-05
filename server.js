// Require Express.js
const express = require("express");

// Require morgan
const morgan = require("morgan");

// Require fs
const fs = require("fs");

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
const debug = (args.debug != "false");
const log = (args.log != "false");

// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port));
});

app.use((req, res, next) => {
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
    const stmt = logdb.prepare(`
        INSERT INTO accesslog
        (remote_addr,remote_user,time,method,url,protocol,http_version,status,referrer_url,user_agent)
        VALUES (?,?,?,?,?,?,?,?,?,?);
    `);
    stmt.run(
        logdata.remoteaddr,
        logdata.remoteuser,
        logdata.time,
        logdata.method,
        logdata.url,
        logdata.protocol,
        logdata.httpversion,
        logdata.status,
        logdata.referer,
        logdata.useragent
    );
    next();
});

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
    app.get('/app/log/access/', (req, res) => {
        try {
            const stmt = logdb.prepare('SELECT * FROM accesslog').all()
            res.status(200).json(stmt);
        } catch {
            console.error(e);
        }
    });

    // Error test endpoint
    app.get('/app/error/', (req, res) => {
        res.status(500);
        throw new Error('Error test successful.');
    });
}

if (log) {
    // Use morgan for logging to files
    // Create a write stream to append (flags: 'a') to a file
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('combined', { stream: accessLog }))
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
    res.status(404).send('404 NOT FOUND' + req.url);
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