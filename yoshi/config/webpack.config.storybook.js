const union = require('lodash/union');
const webpackCommonConfig = require('./webpack.config.common');
const projectConfig = require('./project');

module.exports = config => {
  const projectName = projectConfig.name();
  const cssModules = projectConfig.cssModules();

  config.resolve.extensions = union(config.resolve.extensions, webpackCommonConfig.resolve.extensions);

  config.module.rules = [
    ...webpackCommonConfig.module.rules,
    ...require('../lib/loaders/sass')(false, cssModules, false, projectName).client,
    ...require('../lib/loaders/stylable')(false, cssModules, false).client
  ];

  config.plugins = [
    ...config.plugins || [],
    require('../lib/plugins/babelHappyPack')()
  ];

  return config;
};
