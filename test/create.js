var fs = require('fs');
var rimraf = require('rimraf');
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var assert = require('chai').assert;

var executable = path.resolve(require.resolve('granary'), '..', 'bin', 'granary');

describe('create', function() {
    this.timeout(3000000);

    it('should ask for password, fail on wrong password', function(done) {
        process.env.GRANARY_PASSWORD = 'wrong';

        var child = spawn(executable, ['create', '-u=http://localhost:8872']);

        child.stderr.on('data', function(data) {
            assert.equal(data.toString('utf8'), 'Wrong Granary Server password.\n');
            child.kill('SIGINT');
        });

        child.on('exit', function() {
            done();
        });

    });

    it('should ask for password, fail on no password', function(done) {
        var child = spawn(executable, ['create', '-u=http://localhost:8872']);

        child.stdout.on("data", function() {
            child.stdin.write('\n');
            child.stdin.end();
        });

        child.stderr.on("data", function(data) {
            assert.equal(data, 'Wrong Granary Server password.\n');
            child.kill('SIGINT');
        });

        child.on('exit', function() {
            done();
        });

    });

    it('should work with npm', function(done) {
        process.env.GRANARY_PASSWORD = process.CORRECT_PASSWORD;

        var directory = path.resolve(__dirname + '/fixtures/npm');
        var cmd = executable + ' create -u=http://localhost:8872 --directory=' + directory

        exec(cmd, function(error, _stdout, _stderr) {
            process.chdir(directory);
            var output =
                '************\n\n' +
                'Granary Server will now generate a bundle.\n' +
                'Monitor your Granary at http://localhost:8872/granary/active\n\n' +
                '************\n';
            assert.equal(_stderr, '');
            assert.equal(_stdout, output);

            var stdout = [];
            var finished = false;

            var check = function() {
                // Wait for bundle to extract completely
                setTimeout(function() {
                    assert.ok(fs.existsSync(path.resolve(directory, 'node_modules/rimraf/package.json')));
                    assert.ok(fs.existsSync(path.resolve(directory, 'node_modules/inherits/package.json')));
                    assert.notOk(fs.existsSync(path.resolve(directory,'bower_components')));
                    assert.notOk(fs.existsSync(path.resolve(directory,'bower.json')));
                    assert.notOk(fs.existsSync(path.resolve(directory,'.bowerrc')));
                    assert.notOk(fs.existsSync(path.resolve(directory,'node_modules/mocha')));
                    done();
                }, 1000);
            }

            var run = function() {
                var child = spawn(executable, ['-u=http://localhost:8872']);

                child.stdout.on("data", function(data) {
                    if(data.indexOf('Bundle does not exist for this project') > -1) {
                        child.kill('SIGINT');
                    } else {
                        if(stdout.indexOf(data.toString('utf8')) == -1) {
                            stdout.push(data.toString('utf8'));
                            if(data.indexOf('Granary is done in') > -1) {
                                finished = true;
                                child.kill('SIGINT');
                            }
                        }
                    }
                });

                child.stderr.on("data", function(data) {
                    assert.equal(data, '');
                });

                child.on('exit', function() {
                    if(!finished) {
                        setTimeout(function() {
                            run();
                        }, 1000);
                    } else {
                        check();
                    }
                });
            };

            rimraf(path.resolve(directory, 'node_modules'), function() {
                run();
            });

        });
    });

    it('should work with bower', function(done) {
        process.env.GRANARY_PASSWORD = process.CORRECT_PASSWORD;

        var directory = path.resolve(__dirname + '/fixtures/bower');
        var cmd = executable + ' create -u=http://localhost:8872 --directory=' + directory

        exec(cmd, function(error, _stdout, _stderr) {
            process.chdir(directory);
            var output =
                '************\n\n' +
                'Granary Server will now generate a bundle.\n' +
                'Monitor your Granary at http://localhost:8872/granary/active\n\n' +
                '************\n';
            assert.equal(_stderr, '');
            assert.equal(_stdout, output);

            var stdout = [];
            var finished = false;

            var check = function() {
                // Wait for bundle to extract completely
                setTimeout(function() {
                    assert.ok(fs.existsSync(path.resolve(directory, 'app/bower_components')));
                    assert.ok(fs.existsSync(path.resolve(directory, 'app/bower_components/moment/moment.js'), 'moment should exist'));
                    assert.ok(fs.existsSync(path.resolve(directory, 'bower.json')));
                    done();
                }, 2000);
            }

            var run = function() {
                var child = spawn(executable, ['-u=http://localhost:8872']);

                child.stdout.on("data", function(data) {
                    if(data.indexOf('Bundle does not exist for this project') > -1) {
                        child.kill('SIGINT');
                    } else {
                        if(stdout.indexOf(data.toString('utf8')) == -1) {
                            stdout.push(data.toString('utf8'));
                            if(data.indexOf('Granary is done in') > -1) {
                                finished = true;
                                child.kill('SIGINT');
                            }
                        }
                    }
                });

                child.stderr.on("data", function(data) {
                    assert.equal(data, '');
                });

                child.on('exit', function() {
                    if(!finished) {
                        setTimeout(function() {
                            run();
                        }, 1000);
                    } else {
                        check();
                    }
                });
            };

            rimraf(path.resolve(directory, 'app/bower_components'), function() {
                run();
            });

        });
    });

    it('should work with npm+bower', function(done) {
        process.env.GRANARY_PASSWORD = process.CORRECT_PASSWORD;

        var directory = path.resolve(__dirname + '/fixtures/npm+bower');
        var cmd = executable + ' create -u=http://localhost:8872 --directory=' + directory

        exec(cmd, function(error, _stdout, _stderr) {
            process.chdir(directory);
            var output =
                '************\n\n' +
                'Granary Server will now generate a bundle.\n' +
                'Monitor your Granary at http://localhost:8872/granary/active\n\n' +
                '************\n';
            assert.equal(_stderr, '');
            assert.equal(_stdout, output);

            var stdout = [];
            var finished = false;

            var check = function() {
                // Wait for bundle to extract completely
                setTimeout(function() {
                    assert.ok(fs.existsSync(path.resolve(directory, 'app/bower_components')));
                    assert.ok(fs.existsSync(path.resolve(directory, 'app/bower_components/moment/moment.js'), 'moment should exist'));
                    assert.ok(fs.existsSync(path.resolve(directory, 'bower.json')));
                    assert.ok(fs.existsSync(path.resolve(directory, 'node_modules')));
                    assert.ok(fs.existsSync(path.resolve(directory, 'node_modules/rimraf/package.json')));
                    assert.ok(fs.existsSync(path.resolve(directory, 'node_modules/inherits/package.json')));
                    done();
                }, 3000);
            }

            var run = function() {
                var child = spawn(executable, ['-u=http://localhost:8872']);

                child.stdout.on("data", function(data) {
                    if(data.indexOf('Bundle does not exist for this project') > -1) {
                        child.kill('SIGINT');
                    } else {
                        if(stdout.indexOf(data.toString('utf8')) == -1) {
                            stdout.push(data.toString('utf8'));
                            if(data.indexOf('Granary is done in') > -1) {
                                finished = true;
                                child.kill('SIGINT');
                            }
                        }
                    }
                });

                child.stderr.on("data", function(data) {
                    assert.equal(data, '');
                });

                child.on('exit', function() {
                    if(!finished) {
                        setTimeout(function() {
                            run();
                        }, 1000);
                    } else {
                        check();
                    }
                });
            };

            rimraf(path.resolve(directory, 'app'), function() {
                rimraf(path.resolve(directory, 'node_modules'), function() {
                    run();
                });
            });

        });
    });

});
