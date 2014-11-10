require('./fields_mapping')();
require('./environment')();

var httpRequestHelper = require('./helpers/http_request');
var http = require('http');
var poolDispatcher = require('./dispatchers/pools_dispatcher');

module.exports = {

  dispatch: function(req, res, entity) {
    if (entity === 'server') {
      this.dispatchServer(req, res);
    }
    if (entity === 'pool') {
      poolDispatcher.dispatchPool(req, res);
    }
    if (entity === 'list') {
      this.dispatchList(req, res);
    }
  },

  dispatchList: function (req, res) {
    var attribute = req.params.attribute;
    var filter = '';

    if (attribute === 'servers') filter = 'hostname_s';
    if (attribute === 'pools') filter = 'pool_s';
    if (attribute === 'cores') filter = 'coreName_s';
    if (attribute === 'ports') filter = 'port_i';

    http.get(httpRequestHelper.prepareHttpRequest(createListRequest(req, filter), '/solr/shrank/select?'), function(resp) {
      listJsonResponse(res, resp, filter);
    }).on('error', function(e) {
      console.log(e);
    });
  },

  dispatchServer: function(req,res) {

    var information = req.params.information;
    var attribute = req.params.attribute;
    var filter,jsonFieldWithValue;
    var integral = false;

    if (information === 'list') {

      if (req.params.attribute === 'slowqueries') {
        filter = thothFieldsMappings.slowqueries;
        http.get(httpRequestHelper.prepareHttpRequest(createListInfoServerRequest(req, filter, req.params.page), '/solr/shrank/select?'), function (resp) {
          prepareListInfoJsonResponse(res, resp, req.params.attribute, integral);
        }).on('error', function(e) {
          console.log(e);
        });
      }
      if (req.params.attribute === 'exception') {
        filter = thothFieldsMappings.exception;
        http.get(httpRequestHelper.prepareHttpRequest(createListInfoServerRequest(req, filter, req.params.page), '/solr/collection1/select?'), function (resp) {
          prepareListInfoJsonResponse(res, resp, req.params.attribute, integral);
        }).on('error', function(e) {
          console.log(e);
        });
      }

    } else {

      if (information === 'avg') {
        filter = thothFieldsMappings.avg[attribute];
        jsonFieldWithValue = [thothFieldsMappings.avg[attribute]];
      }

      if (information === 'count') {
        filter = thothFieldsMappings.count[attribute] + ',tot-count_i';
        jsonFieldWithValue = [thothFieldsMappings.count[attribute],'tot-count_i'];
      }

      if (information === 'integral') {
        filter = thothFieldsMappings.integral[attribute];
        jsonFieldWithValue = [thothFieldsMappings.integral[attribute]];
        integral = true;
      }

      if (information === 'distribution') {
        filter = thothFieldsMappings.distribution[attribute];
        jsonFieldWithValue = thothFieldsMappings.distribution[attribute].split(',');
      }

    http.get(httpRequestHelper.prepareHttpRequest(createSolrServerRequest(req, filter), '/solr/shrank/select?'), function (resp) {
        prepareJsonResponse(res, resp, jsonFieldWithValue, integral);
      }).on('error', function(e) {
        console.log(e);
      });
    }
  }
};

/**
 * listJsonResponse
 * @param backendResp
 * @param resp
 * @param attribute
 */
function listJsonResponse(backendResp, resp, attribute){
  try{
    var data ='';
    var blob = '';
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // Get only the docs
        var json = JSON.parse(data).facet_counts;
        var facet_fields = json.facet_fields[attribute];
        var list = [];
        for (var i = 0; i < facet_fields.length; i++){
          if (i % 2 === 0) list.push(facet_fields[i]);
        }
        // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', '*');
        // backendResp.header('Access-Control-Allow-Headers', 'X-Requested-With');

        backendResp.json(
          {'numFound' : list.length, 'list'  : list }
        );
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
    backendResp.status(503).send('Thoth index not available' + err);
  }
}

/**
 * prepareJsonResponse
 * @param backendResp
 * @param resp
 * @param attribute
 * @param integral
 */
function prepareJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data = '',
      blob = '';
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // Get only the docs
        var json = JSON.parse(data).response;
        var docs = json.docs;
        var numFound = json.numFound;
        var numberOfAttributes = attribute.length;

        if (numberOfAttributes == 1) {
          if (attribute.indexOf(',') == -1) {
            blob = addValueIfNull(docs, attribute, 0 );
          }
          else {
            blob = docs;
          }
          if (integral) {
            var c = 0;
            for (var i=0; i<blob.length; i++){
              blob[i].timestamp = blob[i]['masterTime_dt'];
              delete blob[i]['masterTime_dt'];
              c += blob[i][attribute];
              blob[i].value = c;
              delete blob[i][attribute];
            }

          } else {
            for (var i=0; i<blob.length; i++){
              blob[i].timestamp = blob[i]['masterTime_dt'];
              delete blob[i]['masterTime_dt'];
              blob[i].value = blob[i][attribute];
              delete blob[i][attribute];
            }
          }

        }
        else  if (numberOfAttributes === 2) {
          if (attribute[0].indexOf(',') === -1) blob = addValueIfNull(docs, attribute[0], 0 ) ;
          else blob = docs;
          for (var i=0; i<blob.length; i++){
            blob[i].timestamp = blob[i]['masterTime_dt'];
            delete blob[i]['masterTime_dt'];
            blob[i].value = blob[i][attribute[0]];
            delete blob[i][attribute[0]];
            blob[i].tot = blob[i][attribute[1]];
            delete blob[i][attribute[1]];
          }
        }
        else if (numberOfAttributes === 4){
          blob = docs;
          for (var i=0; i<blob.length; i++){
            blob[i].timestamp = blob[i]['masterTime_dt'];
            delete blob[i]['masterTime_dt'];
            blob[i].between_0_10 = blob[i][attribute[0]];
            delete blob[i][attribute[0]];
            blob[i].between_10_100 = blob[i][attribute[1]];
            delete blob[i][attribute[1]];
            blob[i].between_100_1000 = blob[i][attribute[2]];
            delete blob[i][attribute[2]];
            blob[i].over_1000 = blob[i][attribute[3]];
            delete blob[i][attribute[3]];
          }
        }

        // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', '*');
        // backendResp.header('Access-Control-Allow-Headers', 'X-Requested-With');
        // TODO: change to application/json ?
        backendResp.type('application/text');
        backendResp.json(
          {'numFound' : numFound, 'values'  : blob }
        );
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
    backendResp.status(503).send('Thoth index not available' + err);
  }
}

/**
 * prepareListInfoJsonResponse
 * @param backendResp
 * @param resp
 * @param attribute
 * @param integral
 */
function prepareListInfoJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data ='',
      blob = '';
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // // Get only the docs
        var json = JSON.parse(data).response;
        var docs = json.docs;
        var numFound = json.numFound;
        blob = docs;
        // console.log(blob);
        for (var i=0; i<blob.length; i++){
          blob[i].timestamp = blob[i]['date_dt'];
          delete blob[i]['date_dt'];
          delete blob[i]['timestamp_dt'];
          if (attribute == 'slowqueries'){
            blob[i].qtime = blob[i]['qtime_i'];
            delete blob[i]['qtime_i'];
          }
          if (attribute == 'exception'){
            blob[i].exception = blob[i]['stackTrace_s'];
            delete blob[i]['stackTrace_s'];
          }

          blob[i].query = blob[i]['params_s'];
          delete blob[i]['params_s'];
        }

        // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
        backendResp.header('Access-Control-Allow-Origin', '*');
        // backendResp.header('Access-Control-Allow-Headers', 'X-Requested-With');
        // TODO: change to application/json ?
        backendResp.type('application/text');
        backendResp.json(
          {'numFound' : numFound, 'values'  : blob }
        );
      } catch(err){
        backendResp.status(404).send('Data not found. Most probably wrong query was sent to the thoth index' + err);
      }
    });
  }
  catch(err){
    backendResp.status(503).send('Thoth index not available' + err);
  }
}

/**
 * createSolrServerRequest
 * @param req
 * @param filter
 * @returns {{q: string, rows: number, sort: string}}
 */
function createSolrServerRequest(req, filter){
  var server = req.params.server;
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var solrQueryInformation = {
    'q': 'masterDocumentMin_b:true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
    'rows': 10000,
    'sort': 'masterTime_dt asc'
  };
  solrQueryInformation.fl =  filter +',masterTime_dt';
  return solrQueryInformation;
}

/**
 * createListInfoServerRequest
 * @param req
 * @param filter
 * @returns {{q: string, rows: number, sort: *, start: number}}
 */
function createListInfoServerRequest(req, filter){
  var server = req.params.server;
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var page = req.params.page;
  var attribute = req.params.attribute;

  var listType;
  var sortParam;
  if (attribute === 'slowqueries'){
    listType = 'slowQueryDocument_b';
    sortParam = 'qtime_i desc';
  } else{
    listType = 'exception_b';
    sortParam = 'timestamp_dt desc';
  }

  var solrQueryInformation = {

    'q': listType + ':true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND date_dt:[' + start +' TO ' + end +']',
    'rows': 12,
    'sort': sortParam,
    'start' : page*12
  };
  solrQueryInformation.fl =  filter +',date_dt' ;
  return solrQueryInformation;
}

/**
 * createListRequest
 * @param req
 * @param filter
 * @returns Object
 */
function createListRequest(req, filter){
  return {
    'q': '*:*',
    'rows': 0,
    'facet': true,
    'facet.field': filter,
    'facet.limit': 1000
  };
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