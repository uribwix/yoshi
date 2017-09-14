'use strict';

const {watchMode, logIfAny, inTeamCity} = require('./utils');
const {log, logIf, logIfP} = require('./log');
const {base, statics} = require('./globs');
const projectConfig = require('../config/project');
const {spawnSync} = require('child_process');
const {tryRequire} = require('./utils');
const path = require('path');

const watch = watchMode();

function pluginInstall(modules) {
  return new Promise(resolve => {
    spawnSync('npm', ['install', '--silent', '--prefix', 'node_modules/yoshi/plugins'].concat(modules));
    resolve();
  });
}

function pluginRequire(module) {
  const plugin = path.resolve(process.cwd(), `./node_modules/yoshi/plugins/node_modules/${module}`);
  return tryRequire(module) || tryRequire(plugin);
}

module.exports = (plugins, options) => {
  const modules = plugins.reduce((all, next) => all.concat(next), []).filter(x => !pluginRequire(x));
  if (modules.length > 0) {
    log(pluginInstall)(modules);
  }

  return plugins.reduce((promise, parallel) => {
    return promise.then(() => {
      return Promise.all(parallel.map(task => {
        return pluginRequire(task)({log, logIf, logIfP, watch, base, statics, inTeamCity, projectConfig})(options)
          .catch(error => {
            logIfAny(error);
            if (!watch) {
              process.exit(1);
            }
          });
      }));
    });
  }, Promise.resolve());
};
