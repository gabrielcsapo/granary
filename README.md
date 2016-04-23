# granary [![Build Status](https://travis-ci.org/gabrielcsapo/granary.svg?branch=master)](https://travis-ci.org/gabrielcsapo/granary) [![Dependency Status](https://david-dm.org/gabrielcsapo/granary.svg)](https://david-dm.org/gabrielcsapo/granary) [![devDependency Status](https://david-dm.org/gabrielcsapo/granary/dev-status.svg)](https://david-dm.org/gabrielcsapo/granary#info=devDependencies)

> Dependency Bundles for [NPM](https://www.npmjs.org/) and [Bower](http://bower.io/)

Granary helps you:
* Bundle all your dependencies into a compressed archive.
* Avoid committing dependencies into project source.
* Speed up project and dependency installation.
* Speed up continuous integration and deployment.
* Stop relying on NPM and Bower registries.
* Avoid dependency installation issues during deployment.

Granary consists of two components - a tiny command line tool
 and a [Granary Server](https://github.com/gabrielcsapo/grnary-server) that manages the dependencies.

__See the [Granary Documentation](docs/cli.md).__

__See the [Granary Server README](https://github.com/gabrielcsapo/granary-server) to help you setup a Granary Server.__

### Try it out

Install `npm install -g granary`.

Get the sample project:

`git clone https://github.com/gabrielcsapo/granary-sample.git && cd freight-sample`

Run `granary -u http://localhost:8872`, you will now have the NPM and Bower modules!

### Visual Demo

![](docs/demo.gif)

### How it works

![](docs/overview.png)

Freight supports:
* with NPM: `npm-shrinkwrap.json`, NPM rebuild, production only bundles
* with Bower: `.bowerrc`, Bower resolutions
