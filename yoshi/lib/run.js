'use strict';

const path = require('path');
const mkdirp = require('mkdirp');
const {watchMode, logIfAny, inTeamCity} = require('./utils');
const {log, logIf, logIfP} = require('./log');
const {base, statics} = require('./globs');
const projectConfig = require('../config/project');
const {spawnSync} = require('child_process');
const {tryRequire} = require('./utils');
const {usingYarn} = require('yoshi-utils');

const watch = watchMode();

function pluginInstall(modules) {
  return new Promise((resolve, reject) => {
    let cp;
    const yoshiDir = path.resolve(__dirname, '..');
    const pluginsDir = path.join(yoshiDir, 'plugins');

    if (usingYarn()) {
      mkdirp(pluginsDir);
      cp = spawnSync('yarn', ['add', ...modules, '--no-lockfile'], {shell: true, cwd: pluginsDir});
    } else {
      cp = spawnSync('npm', ['install', ...modules, '--prefix', pluginsDir], {shell: true});
    }

    cp.status === 0 ?
      resolve() :
      reject(cp.stderr.toString());
  });
}

function pluginRequire(module) {
  const plugin = path.resolve(process.cwd(), `./node_modules/yoshi/plugins/node_modules/${module}`);
  return tryRequire(module) || tryRequire(plugin);
}

module.exports = (plugins, options) => {
  const modules = plugins.reduce((all, next) => all.concat(next), []).filter(x => !pluginRequire(x));

  const install = modules.length > 0 ?
    log(pluginInstall)(modules) :
    Promise.resolve();

  const result = plugins.reduce((promise, parallel) => {
    return promise.then(() => {
      return Promise.all(parallel.map(task => {
        return pluginRequire(task)({log, logIf, logIfP, watch, base, statics, inTeamCity, projectConfig})(options);
      }));
    });
  }, install);

  return result
    .catch(error => {
      logIfAny(error);
      if (!watch) {
        process.exit(1);
      }
    });
};
