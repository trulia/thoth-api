require('./fields_mapping')();
require('./environment')();

var httpRequestHelper = require('./helpers/http_request');
var http = require('http');
var poolsDispatcher = require('./dispatchers/pools_dispatcher');
var serversDispatcher = require('./dispatchers/servers_dispatcher');

module.exports = {

  dispatch: function(req, res, entity) {
    if (entity === 'server') {
      serversDispatcher.dispatchServer(req, res);
    }
    if (entity === 'pool') {
      poolsDispatcher.dispatchPool(req, res);
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