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
    var filter ='';
    var self = this;

    http.get(prepareRealtimeHttpRequest(createSolrRealtimeRequest(filter)), function(resp) {
      realTimeJsonResponse(resp, filter);
    }).on('error', function(e){
      console.log('Error while trying to get real time data: ', e);
    });
  }

};

/**
 * realTimeJsonResponse
 * @param resp
 * @param filter
 */
function realTimeJsonResponse(resp, filter){
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
            graphicData['qtime'].push({ "timestamp": doc['timestamp_dt'],  "value": doc['qtime_i'] });
          });
        }
        io.emit('new realtime data', graphicData);
        setTimeout(module.exports.pollRealTimeData, 1500);
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
 * createSolrRealtimeRequest
 * @param filter
 * @returns Object
 */
function createSolrRealtimeRequest(filter){
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
 * Creates a zero value for a json property
 * @param  json a json array
 * @param  propertyToCheck property that must have a defined value
 * @param  valueToAdd value that will be added if propertyToCheck does not have a value
 */
function addValueIfNull(json, propertyToCheck, valueToAdd){
  for (var i=0;i<json.length;i++){
    if (!json[i].hasOwnProperty(propertyToCheck)){
      json[i][propertyToCheck] = valueToAdd;
    }
  }
  return json;
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
