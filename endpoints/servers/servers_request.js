module.exports = {
  /**
   * createSolrServerRequest
   * @param req
   * @param filter
   * @returns {{q: string, rows: number, sort: string}}
   */
  createSolrServerRequest: function(req, filter) {
    var server = req.params.server;
    var core = req.params.core;
    var port = req.params.port;
    var start = req.params.start;
    var end = req.params.end;
    var solrQueryInformation = {
      'q': 'masterDocumentMin_b:true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
      'rows': 10000,
      'sort': 'masterTime_dt asc'
    };
    solrQueryInformation.fl =  filter +',masterTime_dt';
    return solrQueryInformation;
  }
};