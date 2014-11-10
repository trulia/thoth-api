module.exports = {
  /**
   * createListRequest
   * @param req
   * @param filter
   * @returns Object
   */
  createListRequest: function(req, filter) {
    return {
      'q': '*:*',
      'rows': 0,
      'facet': true,
      'facet.field': filter,
      'facet.limit': 1000
    };
  }
};