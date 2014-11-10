module.exports = {

  /**
   * prepareListInfoJsonResponse
   * @param backendResp
   * @param resp
   * @param attribute
   * @param integral
   */
  prepareListInfoJsonResponse: function(backendResp, resp, attribute, integral){
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
};