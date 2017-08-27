'use strict';

const chalk = require('chalk');

module.exports = ({projectConfig}) => {
  const optimizeMoment = projectConfig.optimizeMoment();

  function warnIfNotOptimizeMoment() {
    if (!optimizeMoment) {
      console.log(chalk.yellow(`Please enable moment.js optimization, see readme for details: https://github.com/wix/yoshi/blob/master/docs/MOMENT_OPTIMIZATION.md`));
    }

    return Promise.resolve();
  }

  return warnIfNotOptimizeMoment;
};
