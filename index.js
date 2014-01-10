// Thoth configuration
var thoth_hostname = 'thoth';
var thoth_port = 8983;

var express = require('express');
var http = require('http');

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3001);

// Routes
app.get('/api/pool/:pool/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  dispatcher(req, res, 'pool', req.params.information, req.params.attribute)
});

/**
 * Builds the solr query appending different common options
 * @param  q the solr query
 * @param  rows number of results returned
 * @param  fl name of the fields returned
 * @param  sort sorting options
 * @param   stats statistic on a particular field
 * @return the full solr uri
 */
function buildSolrOptions(q,rows,fl,sort,stats){
  var options = {
    host: thoth_hostname,
    port: thoth_port,
    path: '/solr/select?wt=json&omitHeader=true'
  }; 
  if (q != null) options.path +='&q=' + q;
  if (rows != null) options.path +='&rows=' + rows;
  if (fl != null) options.path +='&fl=' + fl;
  if (sort != null) options.path +='&sort=' + sort;
  if (stats != null) options.path +='&stats=true&stats.field=' + stats;
  // console.log(options);
  return options; 
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
 * Creates the request to be sent to solr containing pool information
 * @param  pool name of the pool that contain the name 
 * @param  core name of the core
 * @param  port port number
 * @param  start start time
 * @param  end end time
 * @param  attribute name of attribute or attributes that must be returned by the request
 * @return the request
 */
function poolRequestGenerator(pool, core, port, start, end, attribute){
   return buildSolrOptions(encodeURIComponent('masterDocumentMin_b:true AND pool_s:' + pool + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +" TO " + end +"] "), 
      encodeURIComponent('10000'), encodeURIComponent( attribute +',masterTime_dt,hostname_s'), 
      encodeURIComponent('masterTime_dt asc'), null);  
}

/**
 * Re arrange the json grouping the data by hostname
 * @param  json the payload
 * @param  value the attribute that is gonna be present in each group
 * @return re arranged json
 */
 function groupDataByHostname(json, value){
    var hostnameList = [];
    var blob = [];
    // Get all the hostnames in the response
    for (var i=0;i<json.length;i++){
      if (hostnameList.indexOf(json[i].hostname_s) == -1) hostnameList.push(json[i].hostname_s);
    }
    // Do the grouping, rebuild the json
    hostnameList.forEach(function(d){
      var elements = [];
      for (var i=0;i<json.length;i++) {
        if (json[i].hostname_s == d) elements.push({"timestamp" : json[i].masterTime_dt, "value": (json[i][value] == undefined )? 0 : json[i][value] } );
      }
      var element = { "hostname" : d, "values": elements };       
      blob.push(element);  
    });
    return blob;
 }

/**
 * Handle the response, modifies the json obtained and replies with a new response
 * @param  backendResp the new response
 * @param  resp the reponse that must be handled and modified
 * @param  attribute the attribute that is gonna be present in each group
 * @return the new response
 */
function poolResponseHandler(backendResp, resp, attribute){
  var data ="";
  // Fetch data
  resp.on('data', function(chunk){
    data += chunk;
  });
  // Parse and fix data
  resp.on('end', function(){
    // Get only the docs
    json = JSON.parse(data).response.docs;
    blob = groupDataByHostname(json, attribute);
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    backendResp.json(blob);
  });
}

/**
 * Dispatch the request and handle the response
 * @param  req request
 * @param  res response
 * @param  entity name of the entity that is supported {pool|server}
 * @param  information tipe of data to fetch
 * @param  attribute name of the element to fetch
 */
function dispatcher(req, res, entity, information, attribute){
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;

  if (entity == 'pool'){
    // Looking for pool information
    var pool = req.params.pool;
    if (information == 'avg'){
      // List of attributes that the the API offers for AVG
      if (attribute == 'qtime'){        
        http.get(poolRequestGenerator(pool, core, port, start, end, 'avg_qtime_d') , function (resp) {
          poolResponseHandler(res, resp, 'avg_qtime_d');
        }).on("error", function(e){});    
      
      } else if (attribute =='nqueries'){
        http.get(poolRequestGenerator(pool, core, port, start, end, 'tot-count_i') , function (resp) {
          poolResponseHandler(res, resp, 'tot-count_i');
        }).on("error", function(e){});    
      } else if (attribute =='queriesOnDeck'){
        http.get(poolRequestGenerator(pool, core, port, start, end, 'avg_requestsInProgress_d') , function (resp) {
          poolResponseHandler(res, resp, 'avg_requestsInProgress_d');
        }).on("error", function(e){});    
      }
    } else if (information == 'count'){
      // List of attributes that the the API offers for counts
        if (attribute == 'exception'){
          http.get(poolRequestGenerator(pool, core, port, start, end, 'exceptionCount_i,tot-count_i') , function (resp) {
            poolResponseHandler(res, resp, 'exceptionCount_i');
          }).on("error", function(e){});   
        } else if (attribute == 'hits'){

          http.get(poolRequestGenerator(pool, core, port, start, end, 'zeroHits-count_i,tot-count_i') , function (resp) {
            poolResponseHandler(res, resp, 'zeroHits-count_i');
          }).on("error", function(e){});  
        }
    } 
  }
}


