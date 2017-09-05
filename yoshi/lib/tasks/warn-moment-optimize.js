'use strict';

const path = require('path');
const chalk = require('chalk');
const {tryRequire} = require('../utils');

module.exports = ({projectConfig}) => {
  const optimizeMoment = projectConfig.optimizeMoment();

  function warnIfNotOptimizeMoment() {
    const stats = tryRequire(path.resolve('target/webpack-stats.json'));

    if (stats) {
      const hasMoment = stats.modules
        .map(module => module.name)
        .some(name => name.endsWith('moment/moment.js'));

      if (hasMoment && !optimizeMoment) {
        console.log(chalk.yellow(`WARNING: Please enable moment.js optimization, see readme for details: https://github.com/wix/yoshi/blob/master/docs/MOMENT_OPTIMIZATION.md`));
      }
    }

    return Promise.resolve();
  }

  return warnIfNotOptimizeMoment;
};
