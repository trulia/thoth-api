var io = require('./../../index').io;
var realtimeDispatcher = require('./../../dispatchers/realtime_dispatcher');

module.exports = {
  /**
   * qTimeJsonResponse
   * @param resp
   * @param filter
   */
  qTimeJsonResponse: function(resp, filter){
    try {
      var self = this;
      var data = '';
      // Fetch data
      resp.on('data', function(chunk){
        data += chunk;
      });
      // Parse and fix data
      resp.on('end', function(){
        try {

          // Get only the docs
          var docsReturned = JSON.parse(data).response.docs;
          // Initialize the graphic object
          var graphicData = { "qtime":[]};
          // If no docs, set graphic data to null
          if (docsReturned.length === 0 || docsReturned === null){
            graphicData = {"error" : "No docs returned from solr query"};
          } else {
            docsReturned.forEach(function(doc){
              graphicData['qtime'].push({ "timestamp": Date.parse(doc['timestamp_dt']),  "value": doc['qtime_i'] });
            });
          }
          io.emit('new realtime data', graphicData);
          setTimeout(require('./../../dispatchers/realtime_dispatcher').pollQTimeData, 1500);
        } catch(err) {
          var error =  { "error": 'Data not found. Most probably wrong query was sent to the thoth index' + err};
          io.emit('error in realtime response', error);
        }
      });
    } catch(err) {
      var error = { "error": 'Thoth index not available' + err};
      io.emit('error in realtime response', error);
    }
  },


  /**
   * nExceptionsJsonResponse
   * @param resp
   * @param filter
   */
  nExceptionsJsonResponse: function(resp, filter){
    try {
      var self = this;
      var data = '';

      // Fetch data
      resp.on('data', function(chunk){
        data += chunk;
      });
      // Parse and fix data
      resp.on('end', function(){
        try {

          // Get the response, no docs are returned for this query
          var response = JSON.parse(data).response;

          if (response.numFound) {
            // Initialize the graphic object
            var graphicData = { "exception":[]};
            graphicData['exception'].push({ "timestamp": Date.now(),  "value": response.numFound });
            io.emit('new realtime data', graphicData);
          }
          setTimeout(require('./../../dispatchers/realtime_dispatcher').pollExceptionsData, 1500);

        } catch(err) {
          var error =  { "error": 'Data not found. Most probably wrong query was sent to the thoth index' + err};
          io.emit('error in realtime response', error);
        }
      });
    } catch(err) {
      var error = { "error": 'Thoth index not available' + err};
      io.emit('error in realtime response', error);
    }
  },

  /**
   * zeroHitJsonResponse
   * @param resp
   * @param filter
   */
  zeroHitJsonResponse: function(resp, filter){
    try {
      var self = this;
      var data = '';

      // Fetch data
      resp.on('data', function(chunk){
        data += chunk;
      });
      // Parse and fix data
      resp.on('end', function(){
        try {

          // Get the response, no docs are returned for this query
          var response = JSON.parse(data).response;

          if (response.numFound) {
            // Initialize the graphic object
            var graphicData = {"zeroHits": []};
            graphicData['zeroHits'].push({"timestamp": Date.now(), "value": response.numFound});

            io.emit('new realtime data', graphicData);
          }
        setTimeout(require('./../../dispatchers/realtime_dispatcher').pollZeroHitsData, 1500);
        } catch(err) {
          var error =  { "error": 'Data not found. Most probably wrong query was sent to the thoth index' + err};
          io.emit('error in realtime response', error);
        }
      });
    } catch(err) {
      var error = { "error": 'Thoth index not available' + err};
      io.emit('error in realtime response', error);
    }
  },


  /**
   * nQueriesJsonResponse
   * @param resp
   * @param filter
   */
  nQueriesJsonResponse: function(resp, filter){
    try {
      var self = this;
      var data = '';

      // Fetch data
      resp.on('data', function(chunk){
        data += chunk;
      });
      // Parse and fix data
      resp.on('end', function(){
        try {

          // Get the response, no docs are returned for this query
          var response = JSON.parse(data).response;

          if (response.numFound) {
            // Initialize the graphic object
            var graphicData = {"nqueries": []};
            graphicData['nqueries'].push({"timestamp": Date.now(), "value": response.numFound});

            io.emit('new realtime data', graphicData);
          }
        setTimeout(require('./../../dispatchers/realtime_dispatcher').pollNQueriesData, 1500);
        } catch(err) {
          var error =  { "error": 'Data not found. Most probably wrong query was sent to the thoth index' + err};
          io.emit('error in realtime response', error);
        }
      });
    } catch(err) {
      var error = { "error": 'Thoth index not available' + err};
      io.emit('error in realtime response', error);
    }
  }
};