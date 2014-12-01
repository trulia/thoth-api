/*
 * Rest api for thoth
 *
 * @author Damiano Braga <damiano.braga@gmail.com>
 */

require('./environment')();

var app  = require('express')();
var http = require('http').Server(app);
var io   = require('socket.io')(http);
var util = require('util');

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
console.info('Server started at http://localhost:' + process.env.PORT);

/**
 * Routes available
 */
var routeBase = [
    '/api/%s/%s',
    '/core/:core',
    '/port/:port',
    '/start/:start',
    '/end/:end',
    '/:information',
    '/:attribute'
].join();

/**
 * Servers
 */
var serverRoute = util.format(routeBase, 'server', ':server');
app.get(serverRoute, function (req, res) {
  serversDispatcher.dispatchServer(req, res)
});

app.get(serverRoute + '/:page', function (req, res) {
  serversDispatcher.dispatchServer(req, res)
});

/**
 * Pools
 */
app.get(util.format(routeBase, 'pool', ':pool'), function (req, res) {
  poolsDispatcher.dispatchPool(req, res)
});

/**
 * Info
 */
app.get('/api/list/:attribute', function (req, res) {
  listDispatcher.dispatchList(req, res);
});
