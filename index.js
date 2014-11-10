/*
 * Rest api for thoth
 * 
 * @author Damiano Braga <damiano.braga@gmail.com>
 */

require('./environment')();

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dispatcher = require('./dispatchers');

// Setup websocket for real time data flow
io.on('connection', function(socket){
  socket.on('queryParams', function(queryParams) {

    module.exports.io = io;
    var realtimeDispatcher = require('./dispatchers/realtime_dispatcher');
    realtimeDispatcher.pollRealTimeData(queryParams);
  });
});

// Start node server
http.listen(process.env.PORT);

/**
 * Routes available
 */

// Servers
app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  dispatcher.dispatch(req, res, 'server')
});

app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/:information/:attribute/:page', function (req, res) {
  dispatcher.dispatch(req, res, 'server')
});

// Pools
app.get('/api/pool/:pool/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  dispatcher.dispatch(req, res, 'pool')
});

// Infos
app.get('/api/list/:attribute', function (req, res) {
  dispatcher.dispatch(req, res, 'list');
});