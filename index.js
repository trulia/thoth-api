/*
 * Rest api for thoth
 * 
 * @author Damiano Braga <damiano.braga@gmail.com>
 */

require('./environment')();

var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);

// Dispatchers
var serversDispatcher = require('./dispatchers/servers_dispatcher');
var poolsDispatcher   = require('./dispatchers/pools_dispatcher');
var listDispatcher    = require('./dispatchers/list_dispatcher');

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
  serversDispatcher.dispatchServer(req, res)
});

app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/:information/:attribute/:page', function (req, res) {
  serversDispatcher.dispatchServer(req, res)
});

// Pools
app.get('/api/pool/:pool/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  poolsDispatcher.dispatchPool(req, res)
});

// Infos
app.get('/api/list/:attribute', function (req, res) {
  listDispatcher.dispatchList(req, res);
});