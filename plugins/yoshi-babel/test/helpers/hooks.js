'use strict';

const sh = require('shelljs');

module.exports = {
  installDependencies: cwd => {
    return exec('yarn install --no-lockfile', cwd);
  }
};

function exec(cmd, cwd) {
  const res = sh.exec(cmd, {cwd, silent: true});
  if (res && res.code && res.code !== 0) {
    throw new Error(`Command ${cmd} failed with code ${res.code} and output: ${res.stdout + res.stderr}`);
  } else {
    return res;
  }
}
