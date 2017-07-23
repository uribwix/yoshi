'use strict';

const {expect} = require('chai');
const tp = require('test-phases');
const stripAnsi = require('strip-ansi');
const intercept = require('intercept-stdout');
const babel = require('../index');
const hooks = require('./helpers/hooks');

describe('Babel', () => {
  let test;
  let task;
  let cleanup;
  let stdout = '';

  before(() => cleanup = intercept(s => {
    stdout += stripAnsi(s);
  }));
  beforeEach(() => test = tp.create());
  beforeEach(() => process.chdir(test.tmp));
  beforeEach(() => task = ({watch = false, esModule = false} = {}) => babel({log: a => a, base: () => 'src', watch, projectConfig: {
    isEsModule: () => esModule
  }})());

  afterEach(() => test.teardown());
  afterEach(() => stdout = '');
  after(() => cleanup());

  describe('Babel', () => {
    it('should transpile to dist but only "base" and index.js itself', () => {
      test.setup({
        '.babelrc': '{}',
        'src/a/a.js': 'const a = 1;',
        'index.js': 'const name = \'name\';'
      });

      return task()
        .then(() => {
          expect(test.list('dist')).to.include.members(['src', 'index.js']);
        });
    });

    it('should preserve folder structure, create source maps', () => {
      test.setup({
        '.babelrc': `{}`,
        'src/a/a.js': 'const a = 1;'
      });

      return task()
        .then(() => {
          expect(test.content('dist/src/a/a.js')).to.contain('const a = 1;');
          expect(test.content('dist/src/a/a.js')).to.contain('//# sourceMappingURL=a.js.map');
          expect(test.contains('dist/src/a/a.js.map')).to.be.true;
        });
    });

    it('should transpile when there is babel config inside package.json', () => {
      test.setup({
        'package.json': `{
          "name": "a",\n
          "version": "1.0.4",\n
          "babel": {}
        }`,
        'src/a/a.js': 'const a = 1;'
      });

      return task()
        .then(() => {
          expect(test.content('dist/src/a/a.js')).to.contain('const a = 1;');
          expect(test.content('dist/src/a/a.js')).to.contain('//# sourceMappingURL=a.js.map');
          expect(test.contains('dist/src/a/a.js.map')).to.be.true;
        });
    });

    it('should fail', () => {
      test.setup({
        '.babelrc': '{}',
        'src/a.js': 'function ()'
      });

      return task()
        .then(() => Promise.reject())
        .catch(() => {
          expect(stdout).to.contain('Unexpected token (1:9)');
          expect(stdout).to.contain('1 | function ()');
        });
    });

    it('should ignore dist/ and node_modules/ from being transpiled', () => {
      test.setup({
        'dist/a.js': 'function () {{}',
        'node_modules/a.js': 'function () {{}'
      });

      return task()
        .then(() => {
          expect(test.contains('dist/node_modules')).to.be.false;
        });
    });

    it('should store transpilation output into file system cache', () => {
      test.setup({
        '.babelrc': '{}',
        'src/foo.js': 'const foo = `bar`;'
      });

      return task()
        .then(() => {
          expect(test.list('.', '-RA')).to.contain('target/.babel-cache');
        });
    });

    describe('Transpile twice for ES modules', () => {

      it('should transpile twice if there\'s a `module` field in package.json', () => {
        test.setup({
          'package.json': `{
            "name": "a",
            "version": "1.0.4",
            "module": "./dist/es/src/a.js",
            "dependencies": {
              "babel-preset-es2015": "latest"
            },
            "babel": {
              "presets": [
                ["es2015", {
                  "modules": false
                }]
              ]
            }
          }`,
          'src/a.js': `import b from './b'`,
          'src/b.js': 'export default 1'
        }, [hooks.installDependencies]);

        return task({esModule: true})
          .then(() => {
            expect(test.content('dist/src/a.js')).to.contain(`require('./b')`);
            expect(test.content('dist/es/src/a.js')).to.contain(`import b from './b'`);
          });
      });

      it('should not transpile twice when in watch mode', () => {
        test.setup({
          'package.json': `{
            "name": "a",
            "version": "1.0.4",
            "module": "./dist/es/src/a.js",
            "dependencies": {
              "babel-preset-es2015": "latest"
            },
            "babel": {
              "presets": [
                ["es2015", {
                  "modules": false
                }]
              ]
            }
          }`,
          'src/a.js': `import b from './b'`,
          'src/b.js': 'export default 1'
        }, [hooks.installDependencies]);

        return task({watch: true, esModule: true})
          .then(() => {
            expect(test.content('dist/src/a.js')).to.contain(`require('./b')`);
            expect(test.contains('dist/es')).to.be.false;
          });
      });
    });
  });
});
