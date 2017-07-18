const {isProduction, isCI} = require('yoshi-utils');
const genericNames = require('generic-names');

const cssModulesPattren = module.exports.cssModulesPattren = () =>
  (isProduction() || isCI()) ? `[hash:base64:5]` : `[path][name]__[local]__[hash:base64:5]`;

module.exports.wixCssModulesRequireHook = (rootDir = './dist/src') => {
  require('css-modules-require-hook')({
    rootDir,
    generateScopedName: (name, filepath) => {
      let generate = genericNames(cssModulesPattren(), {context: rootDir});
      if (filepath.indexOf('/node_modules/') > -1) {
        generate = genericNames(cssModulesPattren(), {context: rootDir.replace('/src', '')});
      }
      return generate(name, filepath);
    },
    extensions: ['.scss', '.css'],
    camelCase: true
  });
};
