require('./../fields_mapping')();
require('./../environment')();

var http = require('http');
var querystring = require('querystring');

var httpRequestHelper = require('./../helpers/http_request');
var realtimeRequest   = require('./../endpoints/realtime/realtime_request');
var realtimeResponse  = require('./../endpoints/realtime/realtime_response');

//TODO move this out of global space
var realTimeQueryParams;

module.exports = {

  //realTimeQueryParams: {},

  /**
   * pollRealTimeData
   * Query solr and pull real time data for the given params, for each graph
   */
  pollRealTimeData: function(queryParams) {
    realTimeQueryParams = queryParams;
    this.pollQTimeData();
    this.pollExceptionsData();
    this.pollZeroHitsData();
    this.pollNQueriesData();
  },

  /**
   * pollQTimeData
   */
  pollQTimeData: function() {
    var self = this;
    var filter = '';
    http.get(httpRequestHelper.prepareHttpRequest(realtimeRequest.createSolrQTimeRequest(realTimeQueryParams, filter), '/solr/collection1/select?'), function(resp) {
      realtimeResponse.qTimeJsonResponse(resp, filter);
    }).on('error', function(e) {
      console.log('Error while trying to get qTime real time data: ', e);
    });
  },

  /**
   * pollExceptionsData
   */
  pollExceptionsData: function() {
    var self = this;
    var filter = '';
    http.get(httpRequestHelper.prepareHttpRequest(realtimeRequest.createSolrNExceptionRequest(realTimeQueryParams, filter), '/solr/collection1/select?'), function(resp) {
      realtimeResponse.nExceptionsJsonResponse(resp, filter);
    }).on('error', function(e) {
      console.log('Error while trying to get exceptions real time data: ', e);
    });
  },

  /**
   * pollZeroHitsData
   */
  pollZeroHitsData: function() {
    var self = this;
    var filter = '';
    http.get(httpRequestHelper.prepareHttpRequest(realtimeRequest.createSolrZeroHitRequest(realTimeQueryParams, filter), '/solr/collection1/select?'), function(resp) {
      realtimeResponse.zeroHitJsonResponse(resp, filter);
    }).on('error', function(e) {
      console.log('Error while trying to get zero hits real time data: ', e);
    });
  },

  /**
   * pollNQueriesData
   */
  pollNQueriesData: function() {
    var self = this;
    var filter = '';
    http.get(httpRequestHelper.prepareHttpRequest(realtimeRequest.createSolrNQueriesRequest(realTimeQueryParams, filter), '/solr/collection1/select?'), function(resp) {
      realtimeResponse.nQueriesJsonResponse(resp, filter);
    }).on('error', function(e) {
      console.log('Error while trying to get zero hits real time data: ', e);
    });
  }
};