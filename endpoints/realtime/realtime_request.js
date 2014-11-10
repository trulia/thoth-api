module.exports = {

  /**
   * createSolrQTimeRequest
   * @param queryParams
   * @param filter
   * @returns Object
   */
  createSolrQTimeRequest: function(queryParams, filter){

    var solrQueryInformation = {
      'q': 'hostname_s:' + queryParams.server + ' AND coreName_s:' + queryParams.core + ' AND NOT exception_b:true AND port_i:' + queryParams.port +' AND timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND]',
      'rows': 1,
      'nocache': Math.random(),
      'sort': 'timestamp_dt desc'
    };

    solrQueryInformation.fl =  filter +',qtime_i,timestamp_dt' ;
    return solrQueryInformation;
  },

  /**
   * createSolrNExceptionRequest
   * @param queryParams
   * @param filter
   * @returns Object
   */
  createSolrNExceptionRequest: function(queryParams, filter){

    var solrQueryInformation = {
      'q': 'hostname_s:' + queryParams.server + ' AND coreName_s:' + queryParams.core + ' AND exception_b:true AND port_i:' + queryParams.port +' AND timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND]',
      'rows': 0,
      'nocache': Math.random()
    };

    solrQueryInformation.fl =  filter ;
    return solrQueryInformation;
  },

  /**
   * createSolrZeroHitRequest
   * @param queryParams
   * @param filter
   * @returns Object
   */
  createSolrZeroHitRequest: function(queryParams, filter){

    var solrQueryInformation = {
      'q': 'hostname_s:' + queryParams.server + ' AND coreName_s:' + queryParams.core + ' AND NOT exception_b:true AND port_i:' + queryParams.port +' AND timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND] AND hits_i:0',
      'rows': 0,
      'nocache': Math.random()
    };

    solrQueryInformation.fl =  filter ;
    return solrQueryInformation;
  },

  /**
   * createSolrZeroHitRequest
   * @param queryParams
   * @param filter
   * @returns Object
   */
  createSolrNQueriesRequest: function(queryParams, filter) {

    var solrQueryInformation = {
      'q': 'hostname_s:' + queryParams.server + ' AND coreName_s:' + queryParams.core + ' AND port_i:' + queryParams.port + ' AND timestamp_dt:[NOW/SECOND-1SECOND TO NOW/SECOND]  ',
      'rows': 0,
      'nocache': Math.random()
    };

    solrQueryInformation.fl = filter;
    return solrQueryInformation;
  }
};