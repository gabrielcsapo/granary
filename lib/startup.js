var path = require('path');
var fs = require('fs');
// TODO: do we need this library?
var url = require('url');

module.exports = function(log) {

    var manifest = require('./manifest')(log);
    var remote = require('./remote')(log);

    function Startup() {}

    Startup.log = function(options) {
        options = options || {};

        if (!options.log) {

            if (options.verbose) {
                log.setLevel(log.levels.DEBUG);
            } else {
                log.setLevel(log.levels.INFO);
            }

            if (options.silent) {
                log.setLevel(log.levels.SILENT);
                log.disabled = true;
            }
        }

        log.debug('Options:', options);
    };

    // TODO: cleanup
    Startup.validate = function(options) {
        // check .granaryrc
        // if none, check --url set, try to fallback on env GRANARY_URL
        // use the directory option if presented if not continue
        var granaryUrl;
        var granaryrcPath = path.resolve(options.directory || process.cwd(), '.granaryrc.json');
        try {
            var granaryrc = fs.readFileSync(granaryrcPath, 'utf8');
            if (granaryrc && JSON.parse(granaryrc).url) {
                // .granaryrc options can be overriden by environmental variables
                granaryUrl = options.url || process.env.GRANARY_URL || JSON.parse(granaryrc).url;
            }
        } catch(ex) {
            log.debug(ex);
            granaryUrl = options.url || process.env.GRANARY_URL;
        }

        // throw an error if --url is not set
        if (!granaryUrl) {
            log.error('NOTE: Set server URL with "--url=http://example.com" or GRANARY_URL=http://example.com');
            throw new Error('Server URL not set.')
        }

        options.url = url.format(url.parse(granaryUrl));
    };

    Startup.granaryRequest = function(url, project, extra, options) {
        var start = Date.now();
        var manifestEnv = manifest.detectEnvironment(extra.projectDir);

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
                // NPM project name is used over Bower, unless we Bower only
                project.name = npmData.name;
            }
        }

        log.debug('Project Configuration:', project);
        log.debug('Server Configuration:', url);

        // check if this granary is available
        remote.granaryCheck(url, project, extra)
            .then(
                function(granary) {
                    // granary server response

                    // if wanted to create, then don't download
                    if (options.action === 'create') {
                        // report the status
                        return remote.granaryStatus(granary, url, extra.create);
                    } else {
                        // else just want to download the bundle
                        if (granary.available) {
                            // download the Granary Bundle if available
                            var downloadOpts = {
                                production: extra.production
                            };
                            return remote.granaryDownload(project.name, url, granary.hash, downloadOpts)
                                .then(function(bundleFile) {
                                    return remote.granaryExtract(bundleFile);
                                }).then(function(bundleFile) {
                                    return remote.granaryCleanup(bundleFile);
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
                        } else if (granary.available === false) {
                            // otherwise granary is not available
                            return remote.granaryStatus(granary, url, extra.create);
                        } else {
                            // no response
                            return remote.serverError(url);
                        }
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

    /**
     * Detect if this is a production bundle request
     * @param {Object} options
     */
    Startup.detectProduction = function(options) {
        var production = false;

        if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
            production = true;
        }

        // CLI option overrides NODE_ENV
        if (options.production === false) {
            production = false;
        }

        if (options.production === true) {
            production = true;
        }

        return production;
    };

    return Startup;
};
