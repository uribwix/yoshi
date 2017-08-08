'use strict';

const path = require('path');
const gulp = require('gulp');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const plumber = require('gulp-plumber');
const fileTransformCache = require('gulp-file-transform-cache');
const sourcemaps = require('gulp-sourcemaps');
const babelTranspiler = require('gulp-babel');

function noop() {}

function createInterceptor(resolve, reject) {
  let error;

  return {
    catchErrors: () => plumber(err => {
      error = err;
      printErrors(err);
    }),
    flush: () => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }
  };
}

function printErrors(err) {
  const styledError = err.plugin === 'gulp-babel' ? `\n${err.codeFrame}` : '';
  const message = `${chalk.red(err.message)}${styledError}`;
  console.log(message);
}

module.exports = ({log, watch, base, projectConfig}) => {
  const files = [path.join(base(), '**', '*.js{,x}'), 'index.js'];

  const transpile = ({babelConfig = {}, destDir = 'dist'}) => (pattern = files) => {
    return new Promise((resolve, reject) => {
      const interceptor = createInterceptor(resolve, reject);

      mkdirp(path.resolve('target'));

      gulp.src(pattern, {base: '.'})
        .pipe(interceptor.catchErrors())
        .pipe(fileTransformCache({
          path: path.resolve('target', '.babel-cache'),
          transformStreams: [sourcemaps.init(), babelTranspiler(babelConfig)]
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destDir))
        .once('end', interceptor.flush);
    });
  };

  function babel({done = noop} = {}) {
    const transpileEsModules = projectConfig.isEsModule() && !watch;

    const transpileFn = transpile({
      destDir: transpileEsModules ? 'dist/es' : 'dist'
    });

    const transpileWithCommonJsFn = transpile({
      destDir: 'dist',
      babelConfig: {
        plugins: [
          require.resolve('babel-plugin-transform-es2015-modules-commonjs')
        ]
      }
    });

    const transpileThenDone = pattern => {
      const promises = [transpileWithCommonJsFn, ...transpileEsModules ? [transpileFn] : []]
        .map(f => f(pattern));

      return Promise.all(promises).then(done);
    };

    if (watch) {
      gulp.watch(files, event => transpileThenDone(event.path));
    }

    return transpileThenDone();
  }

  return log(babel);
};
