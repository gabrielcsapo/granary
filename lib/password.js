var read = require('../modules/read');
var P = require('../modules/p-promise/p');

module.exports = function(log) {

  return function() {
    var defer = P.defer();

    if (process.env.GRANARY_PASSWORD) {
      return P(process.env.GRANARY_PASSWORD);
    }

    read({ prompt: 'Granary Server Password: ', silent: true }, function(err, password) {
      if (err) {
        defer.reject(err);
      } else {
        defer.resolve(password);
      }
    });
    return defer.promise;
  };
};
