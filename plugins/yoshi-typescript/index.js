'use strict';

const chalk = require('chalk');
const spawn = require('cross-spawn');
const toPairs = require('lodash.topairs');

const noop = () => {};

const typescriptSuccessRegex = /Compilation complete/;
const typescriptErrorRegex = /\(\d+,\d+\): error TS\d+:/;

function onStdout(resolve, reject) {
  return buffer => {
    const lines = buffer.toString()
      .split('\n')
      .filter(a => a.length > 0);

    const error = lines.some(line => typescriptErrorRegex.test(line));

    print(lines);

    if (error) {
      return reject();
    }

    return resolve();
  };
}

function color(line) {
  if (typescriptErrorRegex.test(line)) {
    return chalk.red(line);
  }

  if (typescriptSuccessRegex.test(line)) {
    return chalk.green(line);
  }

  return chalk.white(line);
}

function print(lines) {
  return lines.forEach(line => console.log(color(line)));
}

function toCliArgs(obj) {
  return toPairs(obj).reduce((list, [key, value]) => [...list, `--${key}`, value], []);
}

module.exports = ({log, watch}) => {
  function typescript({done = noop} = {}) {
    const bin = require.resolve('typescript/bin/tsc');

    const args = toCliArgs({
      project: 'tsconfig.json',
      rootDir: '.',
      outDir: './dist/'
    });

    const child = spawn(bin, [...args, ...watch ? ['--watch'] : []]);

    return new Promise((resolve, reject) => {
      if (watch) {
        child.stdout.on('data', onStdout(done));
        return resolve();
      }

      child.stdout.on('data', onStdout(noop, reject));
      child.on('exit', code => code === 0 ? resolve() : reject());
    });
  }

  return log(typescript);
};
