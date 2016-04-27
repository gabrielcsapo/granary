var read = require('read');
var Promise = require('bluebird');
var levelup = require('levelup');
var db = levelup('./mydb');

module.exports = function(log) {

    return {
        try: function() {
            return new Promise(function(resolve, reject) {
                log.info('calling try');
                if (process.env.GRANARY_PASSWORD) {
                    return resolve(process.env.GRANARY_PASSWORD);
                }
                db.get('password', function (err, value) {
                    if (err) {
                        read({
                            prompt: 'Granary Server Password: ',
                            silent: true
                        }, function(err, password) {
                            if (err) {
                                reject(err);
                            } else {
                                db.put('password', password, function(){
                                    resolve(password);
                                });
                            }
                        });
                    } else {
                        log.info('using logged value');
                        resolve(value);
                    }
                });
            });
        },
        reject: function() {
            return new Promise(function(resolve, reject) {
                db.del('password', function(){
                        resolve();
                });
            });
        }
    };
};
