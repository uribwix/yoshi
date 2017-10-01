'use strict';

const {merge} = require('lodash');
const jestCli = require('jest-cli');
const jestProjectConfig = require('../../config/project').jestConfig();
const {inTeamCity} = require('../utils');

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

    return new Promise((resolve, reject) => {
      jestCli.runCLI({watch, config}, [process.cwd()], result => {
        result.success ? resolve() : reject('jest failed');
      });
    });
  }

  return log(jest);
};
