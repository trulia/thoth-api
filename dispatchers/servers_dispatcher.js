require('./../fields_mapping')();
require('./../environment')();

var http = require('http');
var httpRequestHelper = require('./../helpers/http_request');
var serversRequest    = require('./../endpoints/servers/servers_request');
var serversResponse   = require('./../endpoints/servers/servers_response');
var listRequest       = require('./../endpoints/servers/list_request');
var listResponse      = require('./../endpoints/servers/list_response');

module.exports = {

  /**
   * dispatchServer
   * Based on a request param, decides if getting standard server data or slowqueries/exceptions
   * @param req
   * @param res
   */
  dispatchServer: function(req,res) {
    var self = this;
    var information = req.params.information;
    var attribute = req.params.attribute;
    var filter, jsonFieldWithValue;
    var integral = false;

    if (information === 'list') {

      if (req.params.attribute === 'slowqueries') {
        filter = thothFieldsMappings.slowqueries;
        http.get(httpRequestHelper.prepareHttpRequest(listRequest.createListInfoServerRequest(req, filter, req.params.page), '/solr/shrank/select?'), function (resp) {
          listResponse.prepareListInfoJsonResponse(res, resp, req.params.attribute, integral);
        }).on('error', function(e) {
          console.log(e);
        });
      }
      if (req.params.attribute === 'exception') {
        filter = thothFieldsMappings.exception;
        http.get(httpRequestHelper.prepareHttpRequest(listRequest.createListInfoServerRequest(req, filter, req.params.page), '/solr/collection1/select?'), function (resp) {
          listResponse.prepareListInfoJsonResponse(res, resp, req.params.attribute, integral);
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

      http.get(httpRequestHelper.prepareHttpRequest(serversRequest.createSolrServerRequest(req, filter), '/solr/shrank/select?'), function (resp) {
        serversResponse.prepareServersJsonResponse(res, resp, jsonFieldWithValue, integral);
      }).on('error', function(e) {
        console.log(e);
      });
    }
  }
};