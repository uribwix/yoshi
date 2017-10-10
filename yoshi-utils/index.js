module.exports.isProduction = () => (process.env.NODE_ENV || '').toLowerCase() === 'production';

module.exports.isCI = () => !!(
  process.env.CONTINUOUS_INTEGRATION ||
  process.env.BUILD_NUMBER ||
  process.env.TEAMCITY_VERSION ||
  false
);

module.exports.utilsTestkit = require('./utils-testkit');

module.exports.usingYarn = () => (/\byarn\b/).test(process.env.npm_config_user_agent);

module.exports.pkgManager = () => (process.env.npm_execpath || 'npm');
