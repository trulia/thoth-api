require('./fieldsMapping')();
require('./environment')();

var http = require('http');
var querystring = require('querystring');
var io = require('./index').io;

// Thoth configuration
var thoth_hostname = process.env.THOTH_HOST;
var thoth_port = process.env.THOTH_PORT;

module.exports = {

  /**
   * pollRealTimeData
   * Query solr and pull real time data for the given params
   */
  pollRealTimeData: function() {
    pollQTimeData();
    pollExceptionsData();
    pollZeroHitsData();
    pollNQueriesData();
  }

};

function pollQTimeData() {
  var filter ='';
  http.get(prepareRealtimeHttpRequest(createSolrQTimeRequest(filter)), function(resp) {
    qTimeJsonResponse(resp, filter);
  }).on('error', function(e){
    console.log('Error while trying to get qTime real time data: ', e);
  });
}

function pollExceptionsData() {
  var filter ='';
  http.get(prepareRealtimeHttpRequest(createSolrNExceptionRequest(filter)), function(resp) {
    nExceptionsJsonResponse(resp, filter);
  }).on('error', function(e){
    console.log('Error while trying to get exceptions real time data: ', e);
  });
}

function pollZeroHitsData() {
  var filter ='';
  http.get(prepareRealtimeHttpRequest(createSolrZeroHitRequest(filter)), function(resp) {
    zeroHitJsonResponse(resp, filter);
  }).on('error', function(e){
    console.log('Error while trying to get zero hits real time data: ', e);
  });
}

function pollNQueriesData() {
  var filter ='';
  http.get(prepareRealtimeHttpRequest(createSolrNQueriesRequest(filter)), function(resp) {
    nQueriesJsonResponse(resp, filter);
  }).on('error', function(e){
    console.log('Error while trying to get zero hits real time data: ', e);
  });
}


/**
 * qTimeJsonResponse
 * @param resp
 * @param filter
 */
function qTimeJsonResponse(resp, filter){
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
        setTimeout(pollQTimeData, 1500);
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


/**
 * nExceptionsJsonResponse
 * @param resp
 * @param filter
 */
function nExceptionsJsonResponse(resp, filter){
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
        // Initialize the graphic object
        var graphicData = { "exception":[]};

        graphicData['exception'].push({ "timestamp": Date.now(),  "value": response.numFound });

        io.emit('new realtime data', graphicData);
        setTimeout(pollExceptionsData, 1500);
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

/**
 * zeroHitJsonResponse
 * @param resp
 * @param filter
 */
function zeroHitJsonResponse(resp, filter){
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
        // Initialize the graphic object
        var graphicData = { "zeroHits":[]};
        graphicData['zeroHits'].push({ "timestamp": Date.now(),  "value": response.numFound });

        io.emit('new realtime data', graphicData);
        setTimeout(pollZeroHitsData, 1500);
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


/**
 * nQueriesJsonResponse
 * @param resp
 * @param filter
 */
function nQueriesJsonResponse(resp, filter){
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
        // Initialize the graphic object
        var graphicData = { "nqueries":[]};
        graphicData['nqueries'].push({ "timestamp": Date.now(),  "value": response.numFound });

        io.emit('new realtime data', graphicData);
        setTimeout(pollNQueriesData, 1500);
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

/**
 * createSolrQTimeRequest
 * @param filter
 * @returns Object
 */
function createSolrQTimeRequest(filter){
  var server = 'search501';
  var core = 'active';
  var port = '8050';
  var solrQueryInformation = {
    'q': 'hostname_s:' + server + ' AND coreName_s:' + core + ' AND NOT exception_b:true AND port_i:' + port +' timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND]',
    'rows': 1,
    'nocache': Math.random(),
    'sort': 'timestamp_dt desc'
  };

  solrQueryInformation.fl =  filter +',qtime_i,timestamp_dt' ;
  return solrQueryInformation;
}

/**
 * createSolrNExceptionRequest
 * @param filter
 * @returns Object
 */
function createSolrNExceptionRequest(filter){
  var server = 'search501';
  var core = 'active';
  var port = '8050';
  var solrQueryInformation = {
    'q': 'hostname_s:' + server + ' AND coreName_s:' + core + ' AND exception_b:true AND port_i:' + port +' AND timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND]',
    'rows': 0,
    'nocache': Math.random()
  };
  solrQueryInformation.fl =  filter ;
  return solrQueryInformation;
}
/**
 * createSolrZeroHitRequest
 * @param filter
 * @returns Object
 */
function createSolrZeroHitRequest(filter){
  var server = 'search501';
  var core = 'active';
  var port = '8050';
  var solrQueryInformation = {
    'q': 'hostname_s:' + server + ' AND coreName_s:' + core + ' AND NOT exception_b:true AND port_i:' + port +' timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND] AND hits_i:0',
    'rows': 0,
    'nocache': Math.random()
  };

  solrQueryInformation.fl =  filter ;
  return solrQueryInformation;
}

/**
 * createSolrZeroHitRequest
 * @param filter
 * @returns Object
 */
function createSolrNQueriesRequest(filter){
  var server = 'search501';
  var core = 'active';
  var port = '8050';
  var solrQueryInformation = {
    'q': 'hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port +' timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND] ',
    'rows': 0,
    'nocache': Math.random()
  };

  solrQueryInformation.fl =  filter ;
  return solrQueryInformation;
}

/**
 * prepareRealtimeHttpRequest
 * @param solrOptions
 * @returns {{}}
 */
function prepareRealtimeHttpRequest(solrOptions){
  var requestOptions = {};

  requestOptions.host = thoth_hostname;
  requestOptions.port = thoth_port;
  requestOptions.path = '/solr/collection1/select?';

  var solrQueryOptions = {};
  solrQueryOptions.wt = 'json';
  solrQueryOptions.omitHeader = true;

  for (var key in solrOptions) {
    if (solrOptions.hasOwnProperty(key)) {
      var value = solrOptions[key];
      if (value != null ){
        solrQueryOptions[key] = value ;
      }
    }
  }
  requestOptions.path += querystring.stringify(solrQueryOptions);
  return requestOptions;
}
