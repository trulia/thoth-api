module.exports = {

  /**
   * createListInfoServerRequest
   * @param req
   * @param filter
   * @returns {{q: string, rows: number, sort: *, start: number}}
   */
  createListInfoServerRequest: function(req, filter) {
    var server = req.params.server;
    var core = req.params.core;
    var port = req.params.port;
    var start = req.params.start;
    var end = req.params.end;
    var page = req.params.page;
    var attribute = req.params.attribute;

    var listType;
    var sortParam;
    if (attribute === 'slowqueries'){
      listType = 'slowQueryDocument_b';
      sortParam = 'qtime_i desc';
    } else{
      listType = 'exception_b';
      sortParam = 'timestamp_dt desc';
    }

    var solrQueryInformation = {

      'q': listType + ':true AND hostname_s:' + server + ' AND coreName_s:' + core + ' AND port_i:' + port + ' AND date_dt:[' + start +' TO ' + end +']',
      'rows': 12,
      'sort': sortParam,
      'start' : page*12
    };
    solrQueryInformation.fl =  filter +',date_dt' ;
    return solrQueryInformation;
  }
};