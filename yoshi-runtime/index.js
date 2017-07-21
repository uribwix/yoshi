const {isProduction, isCI} = require('yoshi-utils');
const genericNames = require('generic-names');
const path = require('path');

const cssModulesPattren = module.exports.cssModulesPattren = () =>
  (isProduction() || isCI()) ? `[hash:base64:5]` : `[path][name]__[local]__[hash:base64:5]`;

module.exports.wixCssModulesRequireHook = (rootDir = './dist/src') => {
  require('css-modules-require-hook')({
    rootDir,
    generateScopedName: (name, filepath) => {
      if (filepath.indexOf('/node_modules/') > -1) {
        rootDir = rootDir.replace('/src', '');
      }
      const hashPrefix = require(path.resolve('package.json')).name;
      const generate = genericNames(cssModulesPattren(), {context: rootDir, hashPrefix});
      return generate(name, filepath);
    },
    extensions: ['.scss', '.css'],
    camelCase: true
  });
};
