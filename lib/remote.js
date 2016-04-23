var fs = require('fs');
var spawn = require('child_process').spawn;
var zlib = require('zlib');

var request = require('../modules/request');
var Progress = require('../modules/progress');
var tar = require('../modules/tar-fs/index');
var Promise = require('bluebird');

module.exports = function(log) {

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
                    defer.reject(err);
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
                        var filesize = require('../modules/file-size');
                        var progressOutput = 'Downloading bundle: :bar :percent :etas ';
                        progressOutput += filesize(len).human({
                            si: true
                        });
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
            var extractStart = new Date();

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

                    log.debug('Extraction complete in', (end - extractStart) / 1000, 'seconds.');
                    log.debug('Removing', filePath);

                    resolve(filePath);
                });
        });
    };

    Remote.granaryCleanup = function(filePath) {
        return new Promise(function(resolve, reject) {

            fs.unlink(filePath, function(err) {
                if (err) {
                    log.error('Failed to delete', filePath);
                    log.error(err);
                    reject(err);
                } else {
                    resolve(filePath);
                }
            });

        });
    };

    Remote.granaryPostExtract = function() {
        return new Promise(function(resolve, reject) {

        // if this project extracted node_modules
        fs.exists('node_modules', function(exists) {
            if (exists) {
                var npmRebuild = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['rebuild'], {
                    cwd: process.cwd()
                });
                var errorOutput = null;

                log.info('Running NPM rebuild...');
                npmRebuild.stderr.on('data', function(data) {
                    if (data) {
                        log.debug(data.toString());
                        errorOutput += data.toString();
                    }
                });

                npmRebuild.stdout.on('data', function(data) {
                    if (data) {
                        log.debug(data.toString());
                    }
                });

                npmRebuild.on('close', function(code) {
                    if (code === 0) {
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

    Remote.granaryDone = function(start) {
        return new Promise(function(resolve, reject) {

            var end = Date.now();
            log.info('Granary is done in', (end - start) / 1000, 'seconds.');

        });
    };

    Remote.granaryStatus = function(granary, url, wantedCreate) {
        log.info('************\n');
        if (granary.available && !granary.progress) {
            log.info('Bundle exists for this project.');
        } else if (granary.progress) {
            log.info('Bundle creation currently in progress. %d%', granary.progress);
        } else {
            log.info('Bundle does not exist for this project.');
        }

        if (granary.creating && !granary.progress) {
            log.info('Granary Server will now generate a bundle.');
            log.info('Monitor your Granary at', url + 'granary/active');
        } else {

            if (wantedCreate && !granary.creating) {
                if (granary.available && granary.authenticated) {
                    log.error('To recreate the bundle use --force.');
                } else {
                    log.error('Wrong Granary Server password.');
                }

            } else if (!granary.progress) {
                log.info('To create run: \n granary create -u=' + url);
            }
        }

        log.info('\n************');
        return new Promise(function(resolve, reject) {});
    };

    Remote.serverError = function(server) {
        log.info('************');
        log.info('Freight Server not found at', server);
        log.info('************');
        return new Promise(function(resolve, reject) {});
    };

    return Remote;
};
