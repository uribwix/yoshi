module.exports.isProduction = () => (process.env.NODE_ENV || '').toLowerCase() === 'production';

module.exports.isCI = () => require('is-ci');

module.exports.utilsTestkit = require('./utils-testkit');
