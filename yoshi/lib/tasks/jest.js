'use strict';

const {merge} = require('lodash');
const jestCli = require('jest-cli');
const jestProjectConfig = require('../../config/project').jestConfig();
const {inTeamCity} = require('../utils');

const argsFromConfig = (watch, config) => {
  let argv = [];

  if (watch) {
    argv.push('--watch');
  }

  argv.push(
    '--config',
    JSON.stringify(config)
  );
  return argv;
};

module.exports = ({log, watch}) => {
  function jest() {
    if (inTeamCity()) {
      jestProjectConfig.testResultsProcessor = require.resolve('jest-teamcity-reporter');
      process.argv.push('--teamcity');
    }

    const config = merge(jestProjectConfig, {
      transform: {
        '\\.jsx?$': require.resolve('../../config/jest-transformer')
      }
    });

    const argv = argsFromConfig(watch, config);

    return new Promise((resolve, reject) => {
      jestCli.run(argv, process.cwd(), result => {
        result.success ? resolve() : reject('jest failed');
      });
    });
  }

  return log(jest);
};
