/*
 * Rest api for thoth
 * 
 * @author Damiano Braga <damiano.braga@gmail.com>
 */

require('./environment')();
var express = require('express');
var http = require('http');

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(process.env.PORT);

// Thoth configuration
var thoth_hostname = process.env.THOTH_HOST;
var thoth_port = process.env.THOTH_PORT;


// Routes
app.get('/api/pool/:pool/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  dispatcher(req, res, 'pool', req.params.information, req.params.attribute)
});

app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/:information/:attribute', function (req, res) {
  dispatcher(req, res, 'server', req.params.information, req.params.attribute)
});


app.get('/api/list/:server/core/:core/port/:port/start/:start/end/:end/attribute/:attribute/page/:page/nresults/:nresults', function (req, res) {
  dispatcherForList(req, res);
});


app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/ndoc/:attribute', function (req, res) {
  console.log('here');
  dispatcherList(req, res, 'server', req.params.attribute)
});

app.get('/api/server/:server/core/:core/port/:port/start/:start/end/:end/list/:attribute/page/:page/step/:step', function (req, res) {
  dispatcherNumberDocument(req, res, 'server', req.params.attribute, req.params.page, req.params.step)
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
  console.log(options);
  return options; 
}


function buildSolrOptions2(q,rows,fl,sort,stats,start){
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
  if (start != null) options.path +='&start=' + start;
  console.log(options);
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
 * Creates the request to be sent to solr containing pool information
 * @param  server name of the server
 * @param  core name of the core
 * @param  port port number
 * @param  start start time
 * @param  end end time
 * @param  attribute name of attribute or attributes that must be returned by the request
 * @return the request
 */
function serverRequestGenerator(server, core, port, start, end, attribute){
   return buildSolrOptions(encodeURIComponent('masterDocumentMin_b:true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +" TO " + end +"] "), 
      encodeURIComponent('10000'), encodeURIComponent( attribute +',masterTime_dt'), 
      encodeURIComponent('masterTime_dt asc'), null);  
}


function exceptionListRequestGenerator(server, core, port, start, end, attribute, page, nresults){

  if (attribute == 'exceptions'){
   var opt =  buildSolrOptions(encodeURIComponent('exception_b:true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND timestamp_dt:[' + start +" TO " + end +"] "), 
      encodeURIComponent(nresults), encodeURIComponent( 'stackTrace_s,timestamp_dt'), 
      encodeURIComponent('timestamp_dt asc'), null);  
  opt.path += "&start="+page;    
  }

  return opt;
}




function serverRequestNumDocGenerator(server, core, port, start, end){
   return buildSolrOptions(encodeURIComponent('source_s:ExceptionSolrQuery AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND timestamp_dt:[' + start +" TO " + end +"] "), 
      encodeURIComponent('0'), encodeURIComponent('id'), 
      encodeURIComponent('timestamp_dt asc'), null);  
}


function serverRequestListGenerator(server, core, port, start, end, page, step){
  var p;
  if (page==-1) p = 0 ;
  else p = page;
   return buildSolrOptions2(encodeURIComponent('source_s:ExceptionSolrQuery AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND timestamp_dt:[' + start +" TO " + end +"] "), 
      encodeURIComponent(step), encodeURIComponent('id,bitmask_s,params_s,stackTrace_s'), 
      encodeURIComponent('timestamp_dt asc'), null, encodeURIComponent(p));  
}

/**
 * Re arrange the json grouping the data by hostname
 * @param  json the payload
 * @param  value the attribute that is gonna be present in each group
 * @return re arranged json
 */
 function groupDataByHostname(json, value, integral){
    var hostnameList = [];
    var blob = [];
    // Get all the hostnames in the response
    for (var i=0;i<json.length;i++){
      if (hostnameList.indexOf(json[i].hostname_s) == -1) hostnameList.push(json[i].hostname_s);
    }
    // Do the grouping, rebuild the json
    hostnameList.forEach(function(d){
      var elements = [];
      var integralCount = 0;
      for (var i=0;i<json.length;i++) {
        var v = (json[i][value] == undefined )? 0 : json[i][value];
        if (integral == true) {
          integralCount += v;
          v = integralCount;
        }
        if (json[i].hostname_s == d) elements.push({"timestamp" : json[i].masterTime_dt, "value": v } );
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
    blob = groupDataByHostname(json, attribute, false);
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    backendResp.json(blob);
  });
}


function poolIntegralResponseHandler(backendResp, resp, attribute){
  var data ="";
  // Fetch data
  resp.on('data', function(chunk){
    data += chunk;
  });
  // Parse and fix data
  resp.on('end', function(){
    // Get only the docs
    json = JSON.parse(data).response.docs;
    blob = groupDataByHostname(json, attribute, true);
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    backendResp.json(blob);
  });
}

/**
 * Handle the response, modifies the json obtained and replies with a new response
 * @param  backendResp the new response
 * @param  resp the reponse that must be handled and modified
 * @param  attribute the attribute that is gonna be present in each group
 * @return the new response
 */
function serverResponseHandler(backendResp, resp, attribute){
  var data ="";
  // Fetch data
  resp.on('data', function(chunk){
    data += chunk;
  });
  // Parse and fix data
  resp.on('end', function(){
    // Get only the docs
    json = JSON.parse(data).response.docs;
    if (attribute.indexOf(',') == -1) blob = addValueIfNull(json, attribute, 0 ) ;
    else blob = json;
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    backendResp.json(blob);
  });
}


function serverResponseListHandler(backendResp, resp){
  var data ="";
  // Fetch data
  resp.on('data', function(chunk){
    data += chunk;
  });
  // Parse and fix data
  resp.on('end', function(){
    // Get only the docs
    json = JSON.parse(data).response.docs;
    // if (attribute.indexOf(',') == -1) blob = addValueIfNull(json, attribute, 0 ) ;
    blob = json;
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    backendResp.json(blob);
  });
}

/**
 * Handle the response, modifies the json obtained and replies with a new response
 * @param  backendResp the new response
 * @param  resp the reponse that must be handled and modified
 * @param  attribute the attribute that is gonna be present in each group
 * @return the new response
 */
function serverIntegralResponseHandler(backendResp, resp, attribute){
  var data ="";
  // Fetch data
  resp.on('data', function(chunk){
    data += chunk;
  });
  // Parse and fix data
  resp.on('end', function(){
    // Get only the docs
    json = JSON.parse(data).response.docs;
    // if (attribute.indexOf(',') == -1) blob = addValueIfNull(json, attribute, 0 ) ;
    // else blob = json;

    var blob = json;
    var integral = 0 ;
    for (var i=0; i< json.length; i++){
      integral += parseInt(json[i][attribute]); 
      blob[i].masterTime_dt = json[i].masterTime_dt;
      blob[i].value = integral; 
      delete blob[i][attribute];
      // blob[i][attribute] = integral; 
    }

    // console.log(blob);
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    // console.log(JSON.parse(json));
    backendResp.json(json);
  });
}


function dispatcherNumberDocument(req, res, entity, attribute){
    var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var server = req.params.server;


      // List of attributes that the the API offers for counts
      if (attribute == 'exception'){  
        http.get(serverRequestNumDocGenerator(server, core, port, start, end) , function (resp) {
          serverResponseListHandler(res, resp);
        }).on("error", function(e){});  
        
      }  
}

function dispatcherList(req, res, entity, attribute, page, step){
    var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var server = req.params.server;


      // List of attributes that the the API offers for counts
      if (attribute == 'exception'){  
        http.get(serverRequestListGenerator(server, core, port, start, end, page, step) , function (resp) {
          serverResponseListHandler(res, resp);
        }).on("error", function(e){});  
        
      }  
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
    } else if (information == 'integral'){
      // List of attributes that the the API offers for integral
        if (attribute == 'nqueries'){
          http.get(poolRequestGenerator(pool, core, port, start, end, 'tot-count_i') , function (resp) {
            poolIntegralResponseHandler(res, resp, 'tot-count_i');
          }).on("error", function(e){});    
        }
        if (attribute == 'exception'){
          http.get(poolRequestGenerator(pool, core, port, start, end, 'exceptionCount_i') , function (resp) {
            poolIntegralResponseHandler(res, resp, 'exceptionCount_i');
          }).on("error", function(e){});    
        }        
      } 
  } else if (entity == 'server'){
    // Looking for server specific information
     var server = req.params.server;
     if (information == 'avg'){
      // List of attributes that the the API offers for AVG
      if (attribute == 'qtime'){  
        http.get(serverRequestGenerator(server, core, port, start, end, 'avg_qtime_d') , function (resp) {
          serverResponseHandler(res, resp, 'avg_qtime_d');
        }).on("error", function(e){});    
      }  else if (attribute =='nqueries'){
        http.get(serverRequestGenerator(server, core, port, start, end, 'tot-count_i') , function (resp) {
          serverResponseHandler(res, resp, 'tot-count_i');
        }).on("error", function(e){});    
      } else if (attribute =='queriesOnDeck'){
        http.get(serverRequestGenerator(server, core, port, start, end, 'avg_requestsInProgress_d') , function (resp) {
          serverResponseHandler(res, resp, 'avg_requestsInProgress_d');
        }).on("error", function(e){});    
      }
    }  else if (information == 'count'){
      // List of attributes that the the API offers for counts
        if (attribute == 'exception'){
          http.get(serverRequestGenerator(server, core, port, start, end, 'exceptionCount_i,tot-count_i') , function (resp) {
            serverResponseHandler(res, resp, 'exceptionCount_i');
          }).on("error", function(e){});   
        } else if (attribute == 'hits'){
          http.get(serverRequestGenerator(server, core, port, start, end, 'zeroHits-count_i,tot-count_i') , function (resp) {
            serverResponseHandler(res, resp, 'zeroHits-count_i');
          }).on("error", function(e){});  
        }
      }  else if (information == 'integral'){
      // List of attributes that the the API offers for integral
        if (attribute == 'nqueries'){
          http.get(serverRequestGenerator(server, core, port, start, end, 'tot-count_i') , function (resp) {
            serverIntegralResponseHandler(res, resp, 'tot-count_i');
          }).on("error", function(e){});    
        }
        if (attribute == 'exception'){
          http.get(serverRequestGenerator(server, core, port, start, end, 'exceptionCount_i') , function (resp) {
            serverIntegralResponseHandler(res, resp, 'exceptionCount_i');
          }).on("error", function(e){});    
        }        
      }
     else if (information == 'distribution') {
      // List of attributes that the the API offers for counts
      if (attribute == 'qtime'){  
        http.get(serverRequestGenerator(server, core, port, start, end, 'range-0-10_i,range-10-100_i,range-100-1000_i,range-1000-OVER_i') , function (resp) {
          serverResponseHandler(res, resp, 'range-0-10_i,range-10-100_i,range-100-1000_i,range-1000-OVER_i');
        }).on("error", function(e){});   
      }  
     }  
  }
}


  function dispatcherForList(req, res){
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;

     var attribute = req.params.attribute;

     var server = req.params.server;
     var page = req.params.page;
     var nresults = req.params.nresults;

      http.get(exceptionListRequestGenerator(server, core, port, start, end, attribute,page, nresults) , function (resp) {
        exceptionListResponseHandler(res, resp);
      }).on("error", function(e){});    

 






}


function exceptionListResponseHandler(backendResp, resp){
  var data ="";
  // Fetch data
  resp.on('data', function(chunk){
    data += chunk;
  });
  // Parse and fix data
  resp.on('end', function(){
    // Get only the docs
    json = JSON.parse(data).response;
    var numFound = json.numFound;
    json = JSON.parse(data).response.docs;
    
    // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    backendResp.header('Access-Control-Allow-Origin', "*");
    // TODO: change to application/json ?
    backendResp.type('application/text');
    json.numFound = numFound;
    var uberJson = {
      "results": {
        "total results" : numFound,
        "results returned": json.length,
        "values": json
      }
    }
    backendResp.json(uberJson);
  });
}

