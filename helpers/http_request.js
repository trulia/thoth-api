var querystring = require('querystring');

// Thoth configuration
var thoth_hostname = process.env.THOTH_HOST;
var thoth_port = process.env.THOTH_PORT;

module.exports = {

  /**
   * prepareHttpRequest
   * @param solrOptions
   * @param requestPath
   * @returns {{}}
   */
  prepareHttpRequest: function (solrOptions, requestPath) {

  var requestOptions = {};

  requestOptions.host = thoth_hostname;
  requestOptions.port = thoth_port;
  requestOptions.path = requestPath;

  var solrQueryOptions = {};
  solrQueryOptions.wt = 'json';
  solrQueryOptions.omitHeader = true;

  for (var key in solrOptions) {
    if (solrOptions.hasOwnProperty(key)) {
      var value = solrOptions[key];
      if (value != null ) {
        solrQueryOptions[key] = value ;
      }
    }
  }

  requestOptions.path += querystring.stringify(solrQueryOptions);
  return requestOptions;

  }
};