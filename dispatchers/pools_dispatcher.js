require('./../fields_mapping')();
require('./../environment')();

var http = require('http');
var httpRequestHelper = require('./../helpers/http_request');
var poolsRequest    = require('./../endpoints/pools/pools_request');
var poolsResponse   = require('./../endpoints/pools/pools_response');

module.exports = {

  /**
   * dispatchPool
   * @param req
   * @param res
   */
  dispatchPool: function (req, res) {
    var self = this;
    var information = req.params.information;
    var attribute = req.params.attribute;
    var filter, jsonFieldWithValue;
    var integral = false;

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

    http.get(httpRequestHelper.prepareHttpRequest(poolsRequest.createSolrPoolRequest(req, filter), '/solr/shrank/select?'), function (resp) {
      poolsResponse.poolJsonResponse(res, resp, jsonFieldWithValue, integral);
    }).on('error', function(e) {
      console.log('error while trying to dispatch pool request', e);
    });
  }
};