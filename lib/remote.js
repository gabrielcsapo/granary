var fs = require('fs');
var spawn = require('child_process').spawn;
var zlib = require('zlib');

var request = require('request');
var Progress = require('progress');
var tar = require('tar-fs');
var Promise = require('bluebird');

module.exports = function(log) {

    var password = require('./password')(log);
    var stats = {};

    function Remote() {}

    Remote.granaryCheck = function(url, project, extra) {
        return new Promise(function(resolve, reject) {

            var checkUrl = url + 'granary/check';
            var data = {
                project: project,
                extra: extra
            };

            request({
                url: checkUrl,
                method: 'POST',
                form: data,
                json: true
            }, function(err, resp, body) {
                if (err) {
                    log.error('Granary failed to connect to', url);
                    reject(err);
                } else {
                    log.debug('Response status:', resp.statusCode);
                    log.debug('Response body:', body);
                    switch (resp.statusCode) {
                        case 200:
                            resolve(body);
                            break;
                        case 413:
                            reject('Bundle too large to transmit. Try increasing `limit` on your Freight server.')
                            break;
                        default:
                            reject('Unexpected response: ' + resp.statusCode);
                            break;
                    }
                }
            });

        });
    };

    Remote.granaryDownload = function(name, server, hash, downloadOpts) {
        return new Promise(function(resolve, reject) {
            downloadOpts = downloadOpts || {};
            var bundleFile = 'granary_download_' + Date.now() + '.tar.gz';
            var bar;

            request
                .post(server + 'granary/download')
                .form({
                    hash: hash,
                    name: name,
                    options: downloadOpts
                })
                .on('response', function(res) {
                    if (res.statusCode !== 200) {
                        throw new Error('Failed to download Granary.');
                    } else {
                        var len = parseInt(res.headers['content-length'], 10);
                        var filesize = require('file-size');
                        var progressOutput = 'Downloading bundle: :bar :percent :etas ';
                        progressOutput += filesize(len).human('si');
                        if (!log.disabled) {
                            bar = new Progress(progressOutput, {
                                complete: '|',
                                incomplete: ' ',
                                width: 20,
                                total: len
                            });
                        }
                    }
                })
                .on('data', function(data) {
                    if (!log.disabled) {
                        bar.tick(data.length);
                    }
                })
                .on('error', function(err) {
                    reject(err);
                })
                .on('end', function() {})
                .pipe(fs.createWriteStream(bundleFile))
                .on('close', function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(bundleFile);
                    }
                });

        });
    };

    Remote.granaryExtract = function(filePath) {
        return new Promise(function(resolve, reject) {
            var start = new Date();

            log.info('Extracting bundle...');
            log.debug('Working directory', process.cwd());

            fs.createReadStream(filePath)
                .pipe(zlib.Unzip())
                .pipe(tar.extract('.'))
                .on('error', function(err) {
                    log.error('Extraction Failed');
                    log.error(err);
                    throw reject(err);
                })
                .on('finish', function() {
                    var end = Date.now();
                    var time = (end - start) / 1000;

                    stats.zip_time = time;
                    log.debug('Extraction complete in', time, 'seconds.');
                    log.debug('Removing', filePath);
                    resolve(filePath);
                });
        });
    };

    Remote.granaryCleanup = function(filePath) {
        // TODO: seems silly to need a promise
        return new Promise(function(resolve) {
            fs.unlinkSync(filePath);
            resolve(filePath);
        });
    };

    Remote.granaryPostExtract = function() {
        return new Promise(function(resolve, reject) {
            var start = new Date();

            fs.exists('node_modules', function(exists) {
                if (exists) {
                    var npm = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['rebuild'], {
                        cwd: process.cwd()
                    });
                    var errorOutput = null;

                    log.info('Running NPM rebuild...');
                    npm.stderr.on('data', function(data) {
                        if (data) {
                            log.debug(data.toString());
                            errorOutput += data.toString();
                        }
                    });

                    npm.stdout.on('data', function(data) {
                        if (data) {
                            log.debug(data.toString());
                        }
                    });

                    npm.on('close', function(code) {
                        if (code === 0) {
                            var end = Date.now();
                            var time = (end - start) / 1000;

                            stats.gyp_time = time;
                            resolve();
                        } else {
                            log.error(errorOutput);
                            reject();
                        }
                    });
                } else {
                    resolve();
                }
            });

        });
    };

    Remote.granaryDone = function(start, server, download_opts) {
        return new Promise(function(resolve, reject) { // eslint-disable-line no-unused-vars
            var end = Date.now();
            var time = (end - start) / 1000;
            stats.total_time = time;

            request
                .post(server + 'granary/stats')
                .form({
                    total_time: stats.total_time,
                    zip_time: stats.zip_time,
                    gyp_time: stats.gyp_time,
                    download_opts: download_opts
                })
                .on('response', function() {
                    // we don't care if this finishes or not
                });

            log.info('Granary is done in', time, 'seconds.');
        });
    };

    /* TODO: refactor the if statements to be a switch case on granary.state
            The backend should response with a state so that the front-end can be easily tested and not have edge cases */
    Remote.granaryStatus = function(granary, url, wantedCreate) {
        log.info('************\n');
        if (wantedCreate && granary.authenticated) {
            if (granary.progress) {
                log.info('Bundle creation currently in progress. %d%', granary.progress);
            } else if (granary.available && granary.authenticated) {
                log.error('To recreate the bundle use --force.');
            } else {
                if (granary.creating && !granary.progress) {
                    log.info('Granary Server will now generate a bundle.');
                    log.info('Monitor your Granary at', url + 'granary/active');
                } else if(!granary.progress) {
                    log.info('To create run: \n granary create -u=' + url);
                }
            }
        } else if (wantedCreate && !granary.authenticated) {
            log.error('Wrong Granary Server password.');
            password.reject();
        } else {
            if (granary.available && !granary.progress) {
                log.info('Bundle exists for this project.');
                log.info('Download Location :', url + granary.project.downloadPath);
            } else {
                log.info('Bundle does not exist for this project.');
            }
        }
        log.info('\n************');
        return new Promise(function(resolve, reject) {}); // eslint-disable-line no-unused-vars
    };

    Remote.serverError = function(server) {
        log.info('************');
        log.info('Granary Server not found at', server);
        log.info('************');
        return new Promise(function(resolve, reject) {}); // eslint-disable-line no-unused-vars
    };

    return Remote;
};
