require('./fieldsMapping')();
require('./environment')();

var http = require('http');
var querystring = require('querystring');

// Thoth configuration
var thoth_hostname = process.env.THOTH_HOST;
var thoth_port = process.env.THOTH_PORT;


function prepareJsonResponse(backendResp, resp, attribute, integral){
  try{
    var data ="";
    var blob = "";
    // Fetch data
    resp.on('data', function(chunk){
      data += chunk;
    });
    // Parse and fix data
    resp.on('end', function(){
      try {
        // Get only the docs
        json = JSON.parse(data).response;
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
            for (var i=0;i<blob.length;i++){
              blob[i].timestamp = blob[i]['masterTime_dt'];
              delete blob[i]['masterTime_dt'];
              c += blob[i][attribute];
              blob[i].value = c;
              delete blob[i][attribute];
            }

          } else {
            for (var i=0;i<blob.length;i++){
              blob[i].timestamp = blob[i]['masterTime_dt'];
              delete blob[i]['masterTime_dt'];
              blob[i].value = blob[i][attribute];
              delete blob[i][attribute];
            }
          }

        } 
        else  if (numberOfAttributes == 2) {
          if (attribute[0].indexOf(',') == -1) blob = addValueIfNull(docs, attribute[0], 0 ) ;
          else blob = docs;
          for (var i=0;i<blob.length;i++){
            blob[i].timestamp = blob[i]['masterTime_dt'];
            delete blob[i]['masterTime_dt'];
            blob[i].value = blob[i][attribute[0]];
            delete blob[i][attribute[0]];
            blob[i].tot = blob[i][attribute[1]];
            delete blob[i][attribute[1]];
          }
        }
        else if (numberOfAttributes == 4){
         blob = docs;
          for (var i=0;i<blob.length;i++){
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
        backendResp.header('Access-Control-Allow-Origin', "*");
        // backendResp.header("Access-Control-Allow-Headers", "X-Requested-With");
        // TODO: change to application/json ?
        backendResp.type('application/text');
        backendResp.json(
          {"numFound" : numFound, "values"  : blob }
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



function createSolrServerRequest(req, filter){
	var server = req.params.server;
	var core = req.params.core;
	var port = req.params.port;
	var start = req.params.start;
	var end = req.params.end;
	var solrQueryInformation = {
	  "q": 'masterDocumentMin_b:true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
	  "rows": 10000,
	  "sort": 'masterTime_dt asc'
	};
    solrQueryInformation.fl =  filter +',masterTime_dt' ;
    return solrQueryInformation;
}


function createSolrPoolRequest(req, filter){
  var pool = req.params.pool;
  var core = req.params.core;
  var port = req.params.port;
  var start = req.params.start;
  var end = req.params.end;
  var solrQueryInformation = {
    "q": 'masterDocumentMin_b:true AND pool_s:' + pool + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
    "rows": 10000,
    "sort": 'masterTime_dt asc'
  };
  solrQueryInformation.fl =  filter +',masterTime_dt' ;
  console.log(solrQueryInformation);
  return solrQueryInformation;
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

function prepareHttpRequest(solrOptions){
	var requestOptions = {}

	requestOptions.host = thoth_hostname;
	requestOptions.port = thoth_port;
	requestOptions.path = '/solr/shrank/select?';

	var solrQueryOptions = {};
	solrQueryOptions.wt = 'json';
	solrQueryOptions.omitHeader = true

	for (var key in solrOptions) {
	if (solrOptions.hasOwnProperty(key)) {
	  var value = solrOptions[key];
	  if (value != null ){
	    solrQueryOptions[key] = value ;
	  }
	}
	}
	requestOptions.path += querystring.stringify(solrQueryOptions);
	return requestOptions;
}

module.exports = {
	dispatch: function(req, res, entity){
	  if (entity === 'server'){
	    module.exports.dispatchServer(req, res);
	  }
    if (entity === 'pool'){
      module.exports.dispatchPool(req, res);
    }
	},

  dispatchPool: function (req, res) {

    var information = req.params.information;
    var attribute = req.params.attribute;
    var filter,jsonFieldWithValue;
    var integral = false;

    if (information == 'avg'){
      filter = thothFieldsMappings.avg[attribute];
      jsonFieldWithValue = [thothFieldsMappings.avg[attribute]];
    }

    /*
    if (information == 'count'){
      filter = thothFieldsMappings.count[attribute] + ',tot-count_i';
      jsonFieldWithValue = [thothFieldsMappings.count[attribute],'tot-count_i'];
    }

    if (information == 'integral'){
      filter = thothFieldsMappings.integral[attribute];
      jsonFieldWithValue = [thothFieldsMappings.integral[attribute]];
      integral = true;
    }

    if (information == 'distribution'){
      filter = thothFieldsMappings.distribution[attribute];
      jsonFieldWithValue = thothFieldsMappings.distribution[attribute].split(',');
    }
    */

    http.get(prepareHttpRequest(createSolrPoolRequest(req, filter)), function (resp) {
      prepareJsonResponse(res, resp, jsonFieldWithValue, integral);
    }).on("error", function(e){
        console.log(e);
      });

  },

	dispatchServer: function(req,res){
		var information = req.params.information;
		var attribute = req.params.attribute;
		var filter,jsonFieldWithValue;
		var integral = false;

		if (information == 'avg'){
			filter = thothFieldsMappings.avg[attribute];
			jsonFieldWithValue = [thothFieldsMappings.avg[attribute]];
		}

	  if (information == 'count'){
	    filter = thothFieldsMappings.count[attribute] + ',tot-count_i';
	    jsonFieldWithValue = [thothFieldsMappings.count[attribute],'tot-count_i'];
	  }

	  if (information == 'integral'){
	    filter = thothFieldsMappings.integral[attribute];
	    jsonFieldWithValue = [thothFieldsMappings.integral[attribute]];
	    integral = true;
	  }

    if (information == 'distribution'){
      filter = thothFieldsMappings.distribution[attribute];
      jsonFieldWithValue = thothFieldsMappings.distribution[attribute].split(',');
    }

	  http.get(prepareHttpRequest(createSolrServerRequest(req, filter)), function (resp) {
	    prepareJsonResponse(res, resp, jsonFieldWithValue, integral);
	  }).on("error", function(e){
	    console.log(e);
	  });   
	}

};

