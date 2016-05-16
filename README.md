# granary [![Build Status](https://travis-ci.org/gabrielcsapo/granary.svg?branch=master)](https://travis-ci.org/gabrielcsapo/granary) [![Dependency Status](https://david-dm.org/gabrielcsapo/granary.svg)](https://david-dm.org/gabrielcsapo/granary) [![devDependency Status](https://david-dm.org/gabrielcsapo/granary/dev-status.svg)](https://david-dm.org/gabrielcsapo/granary#info=devDependencies)

# Install

Install `npm install -g granary`.

# Usage

```
Usage: granary [options]

Options:

  -h, --help                   output usage information
  -V, --version                output the version number
  -u, --url <url>              points to location of granary server (Example: "-u http://granaryjs.com")
  -p, --production             downloads the production bundle
  -d, --directory <directory>  Optional path to project.
  -v, --verbose                Verbose mode, shows more information on the console.
  -s, --silent                 does not show any console output
  -l, --log                    sets the log level, defaults to info
  install                      installs the bundle, creates it if does not exist on the server
  rebuild                      rebuilds the bundle on the server
```

# Example

Get the sample project:

`git clone https://github.com/gabrielcsapo/granary-sample.git && cd granary-sample`

Run `granary`, you will now have the NPM and Bower modules!
