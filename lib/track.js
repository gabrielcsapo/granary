var request = require('../modules/request');
var Promise = require('bluebird');

module.exports = function(log) {

    function Track() {}

    Track.request = function(url, project, extra, options) {
        return new Promise(function(resolve, reject) {

            // make sure repository is set in the options
            if (!options.actionParams[0]) {
                return P.reject(new Error('Specify the repository to track'));
            }

            var branch = options['track-branch'] ? options['track-branch'] : 'master';
            var trackDirectory = options['track-directory'] ? options['track-directory'] : null;

            var data = {
                repository: options.actionParams[0],
                branch: branch,
                trackDirectory: trackDirectory,
                password: extra.password
            };
            log.debug('Tracking data', data);

            request({
                url: url + 'granary/track',
                method: 'POST',
                form: data,
                json: true
            }, function(err, resp, body) {
                if (err) {
                    log.error('Freight failed to connect to', url);

                    reject(err);
                } else {
                    log.debug('Response:', body);
                    if (resp.statusCode === 200) {
                        log.info('Tracking successfully setup for:', options.actionParams[0], branch);
                        resolve(body);
                    } else {
                        log.info('Freight Server failed to track', options.actionParams[0], branch);
                        reject(new Error(resp.statusCode + ' ' + body));
                    }
                }
            });
        });
    };

    return Track;
};
