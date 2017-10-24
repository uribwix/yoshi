'use strict';

const {expect} = require('chai');
const shmock = require('shmock');
const stripAnsi = require('strip-ansi');
const tp = require('test-phases');
const deps = require('../index');


describe('yoshi-deps', () => {
  let test, task;
  const port = 3333;
  const npmServer = shmock(port);

  beforeEach(() => {
    test = tp.create();
    process.chdir(test.tmp);
    task = deps({log: a => a});
  });

  afterEach(() => {
    test.teardown();
    npmServer.clean();
  });

  after(() => npmServer.close());

  it('should show a warning when yoshi is at least 1 patch version behind', () => {
    // TODO: use more complex version, like installed - 1.5.2, latest - 1.6.0
    setupProject();
    mockYoshiMeta(['1.0.0', '1.0.1']);

    return task().then(message =>
      expect(stripAnsi(message)).to.equal('WARNING: some dependencies are a bit behind:\nyoshi@1.0.0 should be @1.0.1'));
  });

  it('should show a warning when yoshi is at least 1 patch version behind', () => {
    setupProject();
    mockYoshiMeta(['1.0.0', '2.0.0']);

    return task().then(message =>
      expect(stripAnsi(message)).to.equal('WARNING: some dependencies are a bit behind:\nyoshi@1.0.0 should be @2.0.0'));
  });

  it('should throw an error when yoshi is 2 major versions behind', () => {
    setupProject();
    mockYoshiMeta(['1.0.0', '2.0.0', '3.0.0', '4.0.0']);

    return task().catch(error =>
      expect(stripAnsi(error)).to.equal('ERROR: the following dependencies must be updated:\nyoshi@1.0.0 must be @3.0.0'));
  });

  it('should show nothing if yoshi is up to date', () => {
    setupProject();
    mockYoshiMeta(['1.0.0']);

    return task().then(message =>
      expect(message).to.be.undefined);
  });

  function setupProject() {
    return test.setup({
      '.npmrc': `registry=http://localhost:${port}/`,
      'package.json': '{"devDependencies": {"yoshi": "1.0.0"}}',
      'node_modules/yoshi/package.json': '{"name": "yoshi", "version": "1.0.0"}'
    });
  }

  function mockYoshiMeta(versions) {
    versions = [].concat(versions);
    npmServer.get('/yoshi').reply(200, {
      _id: 'yoshi',
      name: 'yoshi',
      'dist-tags': {latest: versions.slice().pop()},
      versions: versions.reduce((acc, ver) => {
        acc[ver] = {};
        return acc;
      }, {})
    });

    npmServer.get('/yoshi').reply(200, {
      _id: 'yoshi',
      name: 'yoshi',
      'dist-tags': {latest: versions.slice().pop()},
      versions: versions.reduce((acc, ver) => {
        acc[ver] = {};
        return acc;
      }, {})
    });
  }
});
