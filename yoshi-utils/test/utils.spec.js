const {expect} = require('chai');
const {isProduction, isCI, usingYarn, pkgManager} = require('../index');

describe('Yoshi Utils', () => {
  let originalEnv;
  beforeEach(() => {
    originalEnv = Object.assign({}, process.env);
  });
  afterEach(() => process.env = originalEnv);

  describe('.isProduction()', () => {
    it('should return true', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).to.equal(true);
    });

    it('should return false', () => {
      delete process.env.NODE_ENV;
      expect(isProduction()).to.equal(false);
    });

    it('should handle upper case strings', () => {
      process.env.NODE_ENV = 'Production';
      expect(isProduction()).to.equal(true);
    });
  });

  describe('.isCI()', () => {
    it('should return true for TC', () => {
      process.env.BUILD_NUMBER = true;
      expect(isCI()).to.equal(true);
    });

    it('should return true for TC 2', () => {
      process.env.TEAMCITY_VERSION = true;
      expect(isCI()).to.equal(true);
    });

    it('should return true for Travis', () => {
      process.env.CONTINUOUS_INTEGRATION = true;
      expect(isCI()).to.equal(true);
    });

    it('should return false for non CI', () => {
      delete process.env.CONTINUOUS_INTEGRATION;
      delete process.env.BUILD_NUMBER;
      delete process.env.TEAMCITY_VERSION;
      expect(isCI()).to.equal(false);
    });
  });

  describe('.usingYarn()', () => {
    it('should return true if it was executed with yarn', () => {
      process.env['npm_config_user_agent'] = 'yarn/0.27.5 npm/? node/v6.11.1 darwin x64'; // eslint-disable-line dot-notation
      expect(usingYarn()).to.equal(true);
    });

    it('should return false if it was executed with npm', () => {
      process.env['npm_config_user_agent'] = 'npm/3.10.10 node/v6.11.1 darwin x64'; // eslint-disable-line dot-notation
      expect(usingYarn()).to.equal(false);
    });
  });

  describe('.pkgManager()', () => {
    // npm_execpath values
    // yarn - /Users/tomas/.nvm/versions/node/v6.11.1/lib/node_modules/yarn/bin/yarn.js
    // npm - /Users/tomas/.nvm/versions/node/v6.11.1/lib/node_modules/npm/bin/npm-cli.js

    it('should return current package manager', () => {
      const pm = process.env['npm_execpath'] = '/Users/tomas/.nvm/versions/node/v6.11.1/lib/node_modules/yarn/bin/yarn.js'; // eslint-disable-line dot-notation
      expect(pkgManager()).to.equal(pm);
    });

    it('should return "npm" if something goes wrong', () => {
      process.env['npm_execpath'] = null; // eslint-disable-line dot-notation
      expect(pkgManager()).to.equal('npm');
    });
  });
});
