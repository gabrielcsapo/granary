var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
// TODO: do we need this library?
var url = require('url');

module.exports = function(log) {

    var manifest = require('./manifest')(log);
    var remote = require('./remote')(log);
    var password = require('./password')(log);

    function Startup() {}

    // TODO: cleanup
    Startup.check = function(options) {
        // check .granaryrc
        // if none, check --url set, try to fallback on env GRANARY_URL
        // use the directory option if presented if not continue
        var granaryrcPath = path.resolve(options.directory || process.cwd(), '.granaryrc.json');
        try {
            var granaryrc = fs.readFileSync(granaryrcPath, 'utf8');
            if (granaryrc && JSON.parse(granaryrc).url) {
                // .granaryrc options can be overriden by environmental variables
                options.url = options.url || JSON.parse(granaryrc).url;
            }
        } catch (ex) {
            log.debug(ex);
        }

        if (!options.url) {
            log.error('NOTE: Set server URL with "--url=http://example.com"');
            throw new Error('Server URL not set.')
        }

        options.url = url.format(url.parse(options.url));
    };

    Startup.granaryRequest = function(url, project, extra, options) {
        var start = Date.now();
        var manifestEnv = manifest.detectEnvironment(extra.projectDir);

        // TODO: clean this up
        if (manifestEnv.bower) {
            var bowerData = manifest.getData(path.join(extra.projectDir, 'bower.json'));
            project.bower.dependencies = bowerData.dependencies;
            project.bower.devDependencies = bowerData.devDependencies;
            project.bower.resolutions = bowerData.resolutions;
            if (bowerData.name) {
                project.name = bowerData.name;
            }
            // get .bowerrc data
            if (fs.existsSync(path.join(extra.projectDir, '.bowerrc'))) {
                project.bower.rc = manifest.getData(path.join(extra.projectDir, '.bowerrc'));
            }
        }

        if (manifestEnv.npm) {
            var npmData = manifest.getData(path.join(extra.projectDir, 'package.json'));
            project.npm.dependencies = npmData.dependencies;
            project.npm.devDependencies = npmData.devDependencies;

            if (fs.existsSync(path.join(extra.projectDir, 'npm-shrinkwrap.json'))) {
                project.npm.shrinkwrap = manifest.getData(path.join(extra.projectDir, 'npm-shrinkwrap.json'));
            }

            if (npmData.name) {
                project.name = npmData.name;
            }
        }

        log.debug('Project Configuration:', project);
        log.debug('Server Configuration:', url);

        remote.granaryCheck(url, project, extra)
            .then(function(granary) {
                if (granary.available === false || options.rebuild) {
                    extra.create = true;
                    if (options.rebuild) {
                        extra.force = true;
                    }
                    return remote.granaryCheck(url, project, extra, options).then(function(resp) {
                        if (resp.progress) {
                            log.info('Bundle creation currently in progress. %d%', resp.progress);
                        } else if (!resp.authenticated) {
                            log.error('Wrong Granary Server password.');
                            password.reject();
                        } else {
                            log.info('Rebuilding bundle');
                            log.info('Granary Server will now generate a bundle.');
                            log.info('Monitor your Granary at', url + 'granary/active');
                        }
                    })
                } else if (granary.available) {
                    var downloadOpts = {
                        production: extra.production
                    };
                    return remote.granaryDownload(project.name, url, granary.hash, downloadOpts)
                        .then(function(bundleFile) {
                            return remote.granaryExtract(bundleFile);
                        }).then(function(bundleFile) {
                            return new Promise(function(resolve) {
                                fs.unlinkSync(bundleFile);
                                resolve(bundleFile);
                            });
                        }).then(function() {
                            return remote.granaryPostExtract();
                        }).then(
                            function() {
                                downloadOpts.production = extra.production;
                                return remote.granaryDone(start, url, {
                                    name: project.name,
                                    hash: granary.hash,
                                    opts: downloadOpts
                                });
                            },
                            function(err) {
                                log.error(err);
                                throw err;
                            }
                        );
                } else {
                    return remote.serverError(url);
                }
            })
            .then(function() {
                    log.debug('Granary request complete.');
                    if (!options.server) {
                        process.exit(0);
                    }
                },
                function(err) {
                    log.error(err);
                    if (!options.server) {
                        process.exit(1);
                    }
                }
            );
    };

    return Startup;
};
