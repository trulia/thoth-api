module.exports = {

  /**
   * poolJsonResponse
   * @param backendResp
   * @param resp
   * @param attribute
   * @param integral
   */
  poolJsonResponse: function(backendResp, resp, attribute, integral) {
    var self = this;

    try{
      var data = '';
      // Fetch data
      resp.on('data', function(chunk) {
        data += chunk;
      });
      // Parse and fix data
      resp.on('end', function(){
        try {
          // Get only the docs
          var json = JSON.parse(data).response;

          var docs = json.docs,
            servers = [],
            info = [],
            tot = [];

          for (var i=0; i < docs.length; i++) {
            var hostname = docs[i]['hostname_s'];
            self.pushIfNotPresent(hostname, servers);
          }

          for (i=0; i<servers.length; i++){
            var val = [];
            for (var j=0; j<docs.length; j++){

              if (docs[j]['hostname_s'] === servers[i]) {
                var value = docs[j][attribute];
                var timestamp = docs[j]['masterTime_dt'];
                val.push([timestamp, value]);
              }
            }
            tot.push({'key': servers[i], 'values': val});
          }
          // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
          backendResp.header('Access-Control-Allow-Origin', '*');
          // backendResp.header('Access-Control-Allow-Headers', 'X-Requested-With');

          backendResp.json(
            tot
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
   * pushIfNotPresent
   * @param element
   * @param array
   * @returns {*}
   */
  pushIfNotPresent: function(element, array) {
    var present = false;
    var arr = array;
    for (var i=0; i < array.length; i++) {
      if (array[i] == element) present = true;
    }
    if (!present) {
      arr.push(element);
    }
    return arr;
  }
};