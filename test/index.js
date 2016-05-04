var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var cli = '';

describe('granary-server', function() {

    before(function(done) {
        this.timeout(50000);
        // run the npm start task in the granary-server directory
        cli = spawn('npm', ['run', 'start'], {
          cwd: path.resolve('node_modules', 'granary-server'),
          env: process.env
        });
        cli.stdout.on('data', function(data) {
            var message = data.toString('utf8');
            if(message.indexOf('INFO granary-server: Granary Server is now running port 8872') > -1) {
                var config = JSON.parse(fs.readFileSync(path.resolve('node_modules', 'granary-server', 'config', 'dev.json')));
                process.CORRECT_PASSWORD = config.password;
                done();
            }
        });
        cli.stderr.on('data', function (data) {
            console.log('err data: ' + data); // eslint-disable-line no-console
            cli.kill();
        });
    })

    require('./cli');
    require('./create');

});

process.on('exit', function() {
    cli.kill();
});
