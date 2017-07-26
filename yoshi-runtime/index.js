const {isProduction, isCI} = require('yoshi-utils');
const genericNames = require('generic-names');
const path = require('path');

const cssModulesPattren = module.exports.cssModulesPattren = () =>
  (isProduction() || isCI()) ? `[hash:base64:5]` : `[path][name]__[local]__[hash:base64:5]`;

module.exports.wixCssModulesRequireHook = (rootDir = './dist/src') => {
  require('css-modules-require-hook')({
    rootDir,
    generateScopedName: (name, filepath) => {
      let context = rootDir;
      if (filepath.indexOf('/node_modules/') > -1) {
        context = context.replace('/src', '');
      }
      const hashPrefix = require(path.resolve('package.json')).name;
      const generate = genericNames(cssModulesPattren(), {context, hashPrefix});
      return generate(name, filepath);
    },
    extensions: ['.scss', '.css', '.less', '.sass'],
    camelCase: true
  });
};
