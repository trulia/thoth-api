module.exports = {

  /**
   * listJsonResponse
   * @param backendResp
   * @param resp
   * @param attribute
   */
  listJsonResponse: function(backendResp, resp, attribute) {
    try{
      var data ='';
      var blob = '';
      // Fetch data
      resp.on('data', function(chunk){
        data += chunk;
      });
      // Parse and fix data
      resp.on('end', function(){
        try {
          // Get only the docs
          var json = JSON.parse(data).facet_counts;
          var facet_fields = json.facet_fields[attribute];
          var list = [];
          for (var i = 0; i < facet_fields.length; i++){
            if (i % 2 === 0) list.push(facet_fields[i]);
          }
          // Avoid CORS http://en.wikipedia.org/wiki/Cross-origin_resource_sharing
          backendResp.header('Access-Control-Allow-Origin', '*');
          // backendResp.header('Access-Control-Allow-Headers', 'X-Requested-With');

          backendResp.json(
            {'numFound' : list.length, 'list'  : list }
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