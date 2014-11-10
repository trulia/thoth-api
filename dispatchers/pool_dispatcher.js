require('./fields_mapping')();
require('./environment')();

var http = require('http');

module.exports = {

  dispatchPool: function (req, res) {

    var information = req.params.information;
    var attribute = req.params.attribute;
    var filter,jsonFieldWithValue;
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

    http.get(prepareHttpRequest(createSolrPoolRequest(req, filter), '/solr/shrank/select?'), function (resp) {
      poolJsonResponse(res, resp, jsonFieldWithValue, integral);
    }).on('error', function(e) {
      console.log('error while trying to fetch pool', e);
    });
  }

};