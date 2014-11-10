require('./../fields_mapping')();
require('./../environment')();

var http              = require('http');
var httpRequestHelper = require('./../helpers/http_request');
var listRequest       = require('./../endpoints/list/list_request');
var listResponse      = require('./../endpoints/list/list_response');

module.exports = {

  /**
   * dispatchList
   * @param req
   * @param res
   */
  dispatchList: function (req, res) {
    var attribute = req.params.attribute;
    var filter = '';

    if (attribute === 'servers') filter = 'hostname_s';
    if (attribute === 'pools') filter = 'pool_s';
    if (attribute === 'cores') filter = 'coreName_s';
    if (attribute === 'ports') filter = 'port_i';

    http.get(httpRequestHelper.prepareHttpRequest(listRequest.createListRequest(req, filter), '/solr/shrank/select?'), function(resp) {
      listResponse.listJsonResponse(res, resp, filter);
    }).on('error', function(e) {
      console.log(e);
    });
  }
};