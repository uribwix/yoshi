const {expect} = require('chai');
const {killSpawnProcessAndHisChildren} = require('./helpers/process');
const tp = require('./helpers/test-phases');
const fx = require('./helpers/fixtures');
const retryPromise = require('retry-promise').default;

function checkStdout(test, str) {
  return retryPromise({backoff: 100}, () =>
    test.stdout.indexOf(str) > -1 ?
      Promise.resolve() :
      Promise.reject()
  );
}

describe('features', () => {
  let test, child, res;

  beforeEach(() => {
    test = tp.create();
    child = null;
  });

  afterEach(() => {
    test.teardown();
    return killSpawnProcessAndHisChildren(child);
  });

  describe('warn if not optimize moment', () => {
    const warningMessageStart = 'WARNING: Please enable moment.js optimization';

    describe('when the flag is not configured and you have moment in your bundle', () => {
      beforeEach(() => {
        test.setup({
          'src/client.js': `import moment from 'moment';`,
          'node_modules/moment/moment.js': `module.export = 'moment';`,
          'node_modules/moment/package.json': JSON.stringify({
            main: 'moment.js'
          }),
          'package.json': fx.packageJson()
        });
      });

      it('should show warning message on build command', () => {
        res = test.execute('build');
        expect(res.stdout).to.contain(warningMessageStart);
      });
    });

    it(`should not show message when you don't have moment in your bundle`, () => {
      test.setup({
        'src/client.js': `console.log('hello')`,
        'package.json': fx.packageJson()
      });

      res = test.execute('build');
      expect(res.stdout).to.not.contain(warningMessageStart);
    });

    it(`should not show message when the flag is configured`, () => {
      test.setup({
        'src/client.js': `import moment from 'moment';`,
        'node_modules/moment/moment.js': `module.exports = 'moment';`,
        'node_modules/moment/package.json': JSON.stringify({
          main: 'moment.js'
        }),
        'package.json': fx.packageJson({
          optimizeMoment: true
        })
      });

      res = test.execute('build');
      expect(res.stdout).to.not.contain(warningMessageStart);
    });
  });

  describe('add stories to base glob', () => {
    const deprecationMessageStart = 'DEPRECATED: Please enable addStoriesToBaseGlob';

    describe('when package.json flag configured and you have stories directory', () => {
      beforeEach(() => {
        test.setup({
          'package.json': fx.packageJson({
            features: {
              addStoriesToBaseGlob: true
            },
          }),
          'stories/example.js': {
            hey: 'oh'
          }
        });
      });

      it('should not warn on build command', () => {
        res = test.execute('build');
        expect(res.stdout).to.not.contain(deprecationMessageStart);
      });

      it('should not warn on lint command', () => {
        res = test.execute('lint');
        expect(res.stdout).to.not.contain(deprecationMessageStart);
      });
    });

    describe(`when package.json flag configured and you don't have stories directory`, () => {
      beforeEach(() => {
        test.setup({
          'package.json': fx.packageJson({
            features: {
              addStoriesToBaseGlob: true
            },
          }),
        });
      });

      it('should not warn on build command', () => {
        res = test.execute('build');
        expect(res.stdout).to.not.contain(deprecationMessageStart);
      });
    });


    describe('when package.json flag is not configured and you have stories directory', () => {
      beforeEach(() => {
        test.setup({
          'package.json': fx.packageJson(),
          'stories/example.js': {
            hey: 'oh'
          }
        });
      });

      it('should warn on build command', () => {
        res = test.execute('build');
        expect(res.stdout).to.contain(deprecationMessageStart);
      });

      it('should warn on start command', () => {
        child = test.spawn('start');
        return checkStdout(test, deprecationMessageStart);
      });
    });
  });
});
