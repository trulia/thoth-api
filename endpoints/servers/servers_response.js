
module.exports = {

  /**
   * prepareServersJsonResponse
   * @param backendResp
   * @param resp
   * @param attribute
   * @param integral
   */
  prepareServersJsonResponse: function(backendResp, resp, attribute, integral) {
    var self = this;

    try {
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
              blob = self.addValueIfNull(docs, attribute, 0 );
            }
            else {
              blob = docs;
            }
            if (integral) {
              var c = 0;
              for (var i=0; i < blob.length; i++){
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
            if (attribute[0].indexOf(',') === -1) blob = self.addValueIfNull(docs, attribute[0], 0 ) ;
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
  },

  /**
   * Creates a zero value for a json property
   * @param  json a json array
   * @param  propertyToCheck property that must have a defined value
   * @param  valueToAdd value that will be added if propertyToCheck does not have a value
   */
  addValueIfNull: function(json, propertyToCheck, valueToAdd) {
    for (var i = 0; i < json.length; i++) {
      if (!json[i].hasOwnProperty(propertyToCheck)) {
        json[i][propertyToCheck] = valueToAdd;
      }
    }
    return json;
  }
};