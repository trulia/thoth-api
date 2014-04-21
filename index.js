/*
 * Rest api for thoth
 * 
 * @author Damiano Braga <damiano.braga@gmail.com>
 */

require('./environment')();

var express = require('express');
var http = require('http');

var dispatcher = require('./dispatchers');

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(process.env.PORT);

app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  dispatcher.dispatch(req, res, 'server')
});
