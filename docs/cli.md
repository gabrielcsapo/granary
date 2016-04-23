# Granary CLI Documentation

The Granary Granary has several commands and most of them interact with a [Granary Server](https://github.com/gabrielcsapo/granary-server).
You must either [setup a Granary Server](https://github.com/gabrielcsapo/granary-server/blob/master/README.md#server-quick-setup) or use one that already exists.

## Installation

Install the Granary command line utility. Might require `sudo` depending on your system setup.

```
npm install -g gabrielcsapo/granary
```

This will download the Granary CLI from GitHub, avoiding NPM.
It is advised to download the CLI independent of NPM.

After you're done downloading the CLI, setup the default `FREIGHT_URL` environment variable:
```
export FREIGHT_URL=http://granary-server.example
```

You can always specify a custom server using the `--url` or `-u` option.

**All documentation below assumes that you have `FREIGHT_URL` set.**

## Downloading Bundles

To download a bundle simply open a project that has a `package.json` or `bower.json` in the terminal and run:
```
FREIGHT_URL=http://granary-server.example granary
```

If the bundle exists on the server and the dependencies match, then Granary will download the bundle and extract it.

## Authenticated Actions

Using the `granary track` and `granary create` commands you can tell the server to initialize a project bundle.
These actions require server authentication to avoid unauthorized bundles.
The Granary password is configured on the server, you can learn more about this password in
 the [server documentation](https://github.com/gabrielcsapo/granary-server/blob/master/README.md).

Use the `GRANARY_PASSWORD` environment variable to avoid password prompts.
Set it using:
```
export GRANARY_PASSWORD=your_password
```
Use different passwords using instead of the default one:
```
GRANARY_PASSWORD=your_password granary command_here
```

### Track Repositories

Track your `master` branch:

```
granary track https://github.com/gabrielcsapo/granary.git
```

Track other branches:

```
granary track https://github.com/gabrielcsapo/granary.git --track-branch=development
```

Set a custom directory of your project that has your `package.json` and `bower.json`:

```
granary track https://github.com/gabrielcsapo/granary.git --track-directory=static
```

### Create Bundles Manually

From a project directory with a `package.json` or a `bower.json`.

```
granary create
```

### Continuous integration

Setting up Granary on CI environments is easy and works the same way as downloading bundles.
If you want to use Granary with Travis CI, then edit your `.travis.yml`, add these commands in the `before_install` step:
```
- FREIGHT_URL=http://granary-server.example
- npm install -g gabrielcsapo/granary
- granary
```

If your Granary Server is down or the bundle is missing, then Granary will still exit with status code `0`.
This way the build won't fail and the CI will fallback to NPM or Bower registries.

### CLI Options

All available command line options are listed below:

```
$ granary --help
Granary Actions:

get
 Default action. Download the bundle for the current project. Setting `get` is optional.
 Usage: `granary`

create
 Create a bundle for the current project directory on a remote server. Requires password.
 Usage: `granary create`

track
 Track a remote repository for dependency changes.
 Granary will automatically create bundles. `master` branch by default. Looks up root directory by default.
 Usage: `granary track https://github.com:user/repo.git [--track-branch=branch_name] [--track-directory=directory_name]`

Granary Flags:

--help
 -h Display help.

--url
 -u Granary Server URL. Example: "-u=http://example.com"

--production
  Download production required bundle only.

--directory
  Optional path to project.

--verbose
 -v Verbose mode. A lot more information output.

--version
 -V Display Granary CLI version.

--force
 -f A way to force create a bundle. Requires password and create commands.

--silent
  No output.
```
