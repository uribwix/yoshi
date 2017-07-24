const {isProduction, isCI} = require('yoshi-utils');
const genericNames = require('generic-names');

const patterns = module.exports.patterns = {
  long: '[path][name]__[local]__[hash:base64:5]',
  short: '[hash:base64:5]'
};

const isLongCSSFT = process.env.LONG_CSS_PATTERN === 'true';

const cssModulesPattren = module.exports.cssModulesPattren = () =>
  ((isProduction() || isCI()) && !isLongCSSFT) ? patterns.short : patterns.long;

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
    extensions: ['.scss', '.css', '.less', '.sass'],
    camelCase: true
  });
};
