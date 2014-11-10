module.exports = {

  /**
   * createSolrPoolRequest
   * @param req
   * @param filter
   * @returns {{q: string, rows: number, sort: string}}
   */
  createSolrPoolRequest: function(req, filter) {
    var pool = req.params.pool;
    var core = req.params.core;
    var port = req.params.port;
    var start = req.params.start;
    var end = req.params.end;
    var solrQueryInformation = {
      'q': 'masterDocumentMin_b:true AND pool_s:' + pool + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND masterTime_dt:[' + start +' TO ' + end +'] ',
      'rows': 10000,
      'sort': 'masterTime_dt asc'
    };
    solrQueryInformation.fl =  filter +',masterTime_dt,hostname_s' ;
    return solrQueryInformation;
  }
};