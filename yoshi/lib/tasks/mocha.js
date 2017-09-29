'use strict';

const spawn = require('cross-spawn');
const projectConfig = require('../../config/project');
const globs = require('../globs');
const {inTeamCity} = require('../utils');

const pattern = projectConfig.specs.node() || globs.specs();

let proc;

const toCliArgs = options => {
  return Object
    .keys(options)
    .reduce((args, key) => {
      const value = options[key];

      if (value === true) {
        return [...args, `--${key}`];
      }

      if (value === false) {
        return args;
      }

      if (Array.isArray(value)) {
        return [...args, ...value.reduce((a, v) => [...a, `--${key}`, v], [])];
      }

      return [...args, `--${key}`, value];
    }, []);
};

const runMocha = options => new Promise((resolve, reject) => {
  if (proc) {
    proc.kill();
  }

  const args = toCliArgs(options);

  const baseEnv = {
    mocha_reporter: inTeamCity() ? '' : 'progress', // eslint-disable-line camelcase
    NODE_ENV: 'test', SRC_PATH: './src'
  };

  proc = spawn(process.execPath, [require.resolve('mocha/bin/mocha'), ...args, pattern], {
    cwd: process.cwd(),
    env: Object.assign(baseEnv, process.env),
    stdio: 'inherit'
  });

  proc.on('close', code => (code !== 0 ? reject() : resolve()));
});

process.on('exit', () => {
  if (proc) {
    proc.kill('SIGTERM');
  }
});

module.exports = ({log, watch}) => {
  function mocha() {
    const options = {
      reporter: 'mocha-env-reporter',
      timeout: 30000,
      recursive: true,
      require: [require.resolve('../../config/test-setup')],
      watch,
      'watch-extensions': 'js,tsx,ts'
    };

    return runMocha(options);
  }

  return log(mocha);
};
