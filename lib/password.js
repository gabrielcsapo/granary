var read = require('../modules/read');
var Promise = require('bluebird');

module.exports = function(log) {

    return function() {
        return new Promise(function(resolve, reject) {


            if (process.env.GRANARY_PASSWORD) {
                return resolve(process.env.GRANARY_PASSWORD);
            }

            read({
                prompt: 'Granary Server Password: ',
                silent: true
            }, function(err, password) {
                if (err) {
                    reject(err);
                } else {
                    resolve(password);
                }
            });
        });
    };
};
