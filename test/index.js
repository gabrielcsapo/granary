var path = require('path');
var spawn = require('child_process').spawn;

var cli = '';

describe('granary-server', function() {

    before(function(done) {
        this.timeout(50000);
        console.log(path.resolve('node_modules', 'granary-server'));
        cli = spawn('npm', ['run', 'start'], {
          cwd: path.resolve('node_modules', 'granary-server'),
          env: process.env
        });
        cli.stdout.on('data', function(data) {
            var message = data.toString('utf8');
            console.log(message);
            if(message.indexOf('INFO freight-server: Granary Server is now running port 8872') > -1) {
                done();
            }
        });
        cli.stderr.on('data', function (data) {
            console.log('err data: ' + data);
            cli.kill();
        });
    })

    after(function() {
        cli.kill();
    });

    require('./basic');
    require('./create');
    require('./error_bower');
    require('./extract');
    require('./error');
    // require('./track');
});

process.on('exit', function() {
    cli.kill();
});
