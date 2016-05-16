var fs = require('fs');
var path = require('path');
var winston = require('winston');
var program = require('commander');

program
    .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'))).version)
    .option('-u, --url <url>', 'points to location of granary server (Example: "-u=http://granaryjs.com")', 'http://granaryjs.com')
    .option('-p, --production', 'downloads the production bundle')
    .option('-d, --directory <directory>', 'Optional path to project.')
    .option('-v, --verbose', 'Verbose mode, shows more information on the console.')
    .option('-s, --silent', 'does not show any console output')
    .option('-l, --log', 'sets the log level, defaults to info', 'info')
    // .option('track', 'tracks the current repo')
    .option('install', 'installs the bundle, creates it if does not exist on the server')
    .option('rebuild', 'rebuilds the bundle on the server')
    .parse(process.argv);

if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    program.production = true;
}

winston.setLevels(program.log || 'info');
var log = winston.cli();

log.debug(' - url %j', program.url);
log.debug(' - production %s', program.production);
log.debug(' - directory %s', program.directory);
log.debug(' - verbose %s', program.verbose);
log.debug(' - force %s', program.force);
log.debug(' - silent %s', program.silent);
log.debug(' - log %s', program.log);

var startup = require('./startup')(log);
var password = require('./password')(log);

// checks for .granaryrc.json and other defaults
startup.check(program);

var extra  = {
  create: false,
  track: false,
  force: false,
  priority: 'normal',
  production: program.production,
  projectDir: program.directory || '.'
};
// TODO: do not let this run without a project name
var project = {
  name: 'noname',
  npm: {
    dependencies: {},
    devDependencies: {}
  },
  bower: {
    dependencies: {},
    devDependencies: {},
    resolutions: {}
  },
  bowerrc: {}
};

return password.try().then(function(password) {
  extra.password = password;
  return startup.granaryRequest(program.url, project, extra, program);
});
