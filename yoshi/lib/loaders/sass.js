'use strict';

const path = require('path');
const {merge} = require('lodash/fp');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {cssModulesPattren} = require('yoshi-runtime');

module.exports = (separateCss, cssModules, tpaStyle, projectName) => {
  const cssLoaderOptions = {
    camelCase: true,
    sourceMap: !!separateCss,
    localIdentName: cssModulesPattren(),
    hashPrefix: projectName,
    modules: cssModules,
    importLoaders: tpaStyle ? 4 : 3
  };

  const sassLoaderOptions = {
    sourceMap: true,
    includePaths: ['node_modules', 'node_modules/compass-mixins/lib']
  };

  const globalRegex = /\.global.s?css$/;
  const stylableRegex = /\.st\.css$/;

  const getScssRule = (ruleConfig, loaderConfig) => merge(ruleConfig, {
    test: /\.s?css$/,
    use: clientLoader(separateCss, {loader: 'style-loader', options: {singleton: true}}, [
      {
        loader: 'css-loader',
        options: merge(cssLoaderOptions, loaderConfig)
      },
      {
        loader: 'postcss-loader',
        options: {
          config: {
            path: path.join(__dirname, '..', '..', 'config', 'postcss.config.js'),
          },
          sourceMap: true
        }
      },
      ...tpaStyle ? ['wix-tpa-style-loader'] : [],
      {
        loader: 'sass-loader',
        options: sassLoaderOptions
      }
    ])
  });

  return {
    client: [
      getScssRule({include: globalRegex, exclude: stylableRegex}, {modules: false}),
      getScssRule({exclude: [globalRegex, stylableRegex]})
    ],
    specs: {
      test: /\.s?css$/,
      exclude: [stylableRegex],
      use: [
        {
          loader: 'css-loader/locals',
          options: cssLoaderOptions
        },
        ...tpaStyle ? ['wix-tpa-style-loader'] : [],
        {
          loader: 'sass-loader',
          options: sassLoaderOptions
        }
      ]
    }
  };
};

function clientLoader(separateCss, l1, l2) {
  return separateCss ? ExtractTextPlugin.extract({fallback: l1, use: l2}) : [l1].concat(l2);
}
