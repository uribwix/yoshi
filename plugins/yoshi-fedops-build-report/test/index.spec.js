'use strict';
const sinonChai = require('sinon-chai');
const chai = require('chai');
const tp = require('test-phases');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
chai.use(sinonChai);
const {expect} = chai;

let mysqlQueryError = null;
const mysqlQuerySpy = sinon.spy((sql, values, callback) => {
  callback(mysqlQueryError);
});
const mysqlEndSpy = sinon.spy(callback => {
  callback();
});
const createConnection = () => ({
  query: mysqlQuerySpy,
  end: mysqlEndSpy
});

const fedopsBundleSize = proxyquire('../index', {
  'mysql': {createConnection}
});

const APP_NAME = 'your-unique-app-name'; // eslint-disable-line camelcase
const fedopsJson = JSON.stringify({
  app_name: APP_NAME // eslint-disable-line camelcase
}, null, 2);

describe('measure bundle size', () => {
  const timestamp = (new Date('2017-06-26')).getTime();
  const someFileContent = `console.log('hello world');`;
  const someOtherFileContent = `console.log('foo bar');`;
  const cssFileContent = `.app {margin: 4px;}`;
  const bundleSize = content => content.length + 1;
  let clock;
  let test;

  const createTask = (options = {}) => {
    const rest = Object.assign({}, options);
    delete rest.projectConfig;

    const defaults = {
      log: a => a,
      inTeamCity: () => true,
      projectConfig: {},
    };

    return fedopsBundleSize(Object.assign({}, defaults, rest));
  };

  const envVariables = new Map([
    ['FEDOPS_BUILD_REPORT_SQL_HOST', 'host'],
    ['FEDOPS_BUILD_REPORT_SQL_USER', 'user'],
    ['FEDOPS_BUILD_REPORT_SQL_PASS', 'pass'],
    ['FEDOPS_BUILD_REPORT_SQL_DB', 'db'],
    ['FEDOPS_BUILD_REPORT_SQL_TABLE', 'table']
  ]);

  const dbQueryValues = (bundleName, fileContent, appName = APP_NAME) => {
    const table = envVariables.get('FEDOPS_BUILD_REPORT_SQL_TABLE');

    return [
      table,
      appName,
      bundleName,
      bundleSize(fileContent)
    ];
  };

  before(() => {
    envVariables.forEach((value, key) => process.env[key] = value);
  });

  after(() => {
    for (let key of envVariables.keys()) {
      delete process.env[key];
    }
  });

  beforeEach(() => {
    test = tp.create();
    process.chdir(test.tmp);
    clock = sinon.useFakeTimers(timestamp);
  });

  afterEach(() => {
    test.teardown();
    mysqlQuerySpy.reset();
    mysqlEndSpy.reset();
    clock.restore();
  });

  it('shouldn\'t do anything if not in team city', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask({inTeamCity: () => false});
    return task().then(() => {
      expect(mysqlQuerySpy).not.to.have.been.called;
      expect(mysqlEndSpy).not.to.have.been.called;
    });
  });

  it('shouldn\'t do anything if no fedops config found', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent
    });
    const task = createTask({inTeamCity: () => false});
    return task().then(() => {
      expect(mysqlQuerySpy).not.to.have.been.called;
      expect(mysqlEndSpy).not.to.have.been.called;
    });
  });

  it('should report the size off a single min.js file', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.been.calledOnce;
      expect(mysqlEndSpy).to.have.been.calledOnce;
      expect(mysqlQuerySpy.firstCall.args[1]).to.eql(dbQueryValues('app.bundle.min.js', someFileContent));
    });
  });

  it('should report the size off a single min.css file', () => {
    test.setup({
      'dist/statics/app.bundle.min.css': cssFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.been.calledOnce;
      expect(mysqlEndSpy).to.have.been.calledOnce;
      expect(mysqlQuerySpy.firstCall.args.length).equal(3);
      expect(mysqlQuerySpy.firstCall.args[1]).to.eql(dbQueryValues('app.bundle.min.css', cssFileContent));
    });
  });

  it('should report the size of all min js and css files', () => {
    test.setup({
      'dist/statics/a.bundle.min.css': cssFileContent,
      'dist/statics/a.bundle.min.js': someFileContent,
      'dist/statics/b.bundle.min.js': someOtherFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.been.calledThrice;
      expect(mysqlEndSpy).to.have.been.calledOnce;
      expect(mysqlQuerySpy.getCall(0).args[1]).to.eql(dbQueryValues('a.bundle.min.css', cssFileContent));
      expect(mysqlQuerySpy.getCall(1).args[1]).to.eql(dbQueryValues('a.bundle.min.js', someFileContent));
      expect(mysqlQuerySpy.getCall(2).args[1]).to.eql(dbQueryValues('b.bundle.min.js', someOtherFileContent));
    });
  });

  it('should not report a non minified bundle', () => {
    test.setup({
      'dist/statics/b.bundle.min.js': someFileContent,
      'dist/statics/b.bundle.js': someFileContent,
      'dist/statics/b.bundle.min.css': cssFileContent,
      'dist/statics/b.bundle.css': cssFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.been.calledTwice;
      expect(mysqlEndSpy).to.have.been.calledOnce;
      expect(mysqlQuerySpy.getCall(0).args[1]).to.eql(dbQueryValues('b.bundle.min.css', cssFileContent));
      expect(mysqlQuerySpy.getCall(1).args[1]).to.eql(dbQueryValues('b.bundle.min.js', someFileContent));
    });
  });

  it('should support json arrays', () => {
    test.setup({
      'dist/statics/a.bundle.min.css': cssFileContent,
      'dist/statics/a.bundle.min.js': someFileContent,
      'fedops.json': `[${fedopsJson}]`
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.been.calledTwice;
      expect(mysqlEndSpy).to.have.been.calledOnce;
      expect(mysqlQuerySpy.getCall(0).args[1]).to.eql(dbQueryValues('a.bundle.min.css', cssFileContent));
      expect(mysqlQuerySpy.getCall(1).args[1]).to.eql(dbQueryValues('a.bundle.min.js', someFileContent));
    });
  });

  it('should support report each file once for each app in the array', () => {
    const ANOTHER_APP_NAME = 'another-unique-app-name'; // eslint-disable-line camelcase
    test.setup({
      'dist/statics/a.bundle.min.css': cssFileContent,
      'dist/statics/a.bundle.min.js': someFileContent,
      'fedops.json': `[${fedopsJson}, {"app_name": "${ANOTHER_APP_NAME}"}]`
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.callCount(4);
      expect(mysqlEndSpy).to.have.calledOnce;
      expect(mysqlQuerySpy.getCall(0).args[1]).to.eql(dbQueryValues('a.bundle.min.css', cssFileContent));
      expect(mysqlQuerySpy.getCall(1).args[1]).to.eql(dbQueryValues('a.bundle.min.css', cssFileContent, ANOTHER_APP_NAME));
      expect(mysqlQuerySpy.getCall(2).args[1]).to.eql(dbQueryValues('a.bundle.min.js', someFileContent));
      expect(mysqlQuerySpy.getCall(3).args[1]).to.eql(dbQueryValues('a.bundle.min.js', someFileContent, ANOTHER_APP_NAME));
    });
  });

  it('should report the appName if no app_name in fedops.json', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"appName": "${APP_NAME}"}`
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.calledOnce;
      expect(mysqlEndSpy).to.have.calledOnce;
      expect(mysqlQuerySpy.getCall(0).args[1]).to.eql(dbQueryValues('app.bundle.min.js', someFileContent));
    });
  });

  it('should not do anything if no app_name or appName in fedops.json', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"not_app_name": "${APP_NAME}"}`
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).not.to.have.been.called;
      expect(mysqlEndSpy).to.have.been.called;
    });
  });

  it('should still send a report for a valid app', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `[${fedopsJson}, {"not_app_name": "foobar"}]`
    });
    const task = createTask();
    return task().then(() => {
      expect(mysqlQuerySpy).to.have.calledOnce;
      expect(mysqlEndSpy).to.have.calledOnce;
      expect(mysqlQuerySpy.getCall(0).args[1]).to.eql(dbQueryValues('app.bundle.min.js', someFileContent));
    });
  });

  it('should warn if bundle size SQL query fails', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"appName": "${APP_NAME}"}`
    });
    const task = createTask();
    sinon.spy(console, 'warn');
    mysqlQueryError = {code: 'somecode'};
    return task().then(() => {
      const expectedWarning = 'Error code somecode. Failed to write bundle size to the database. ' +
        'App: your-unique-app-name. Bundle: app.bundle.min.js.bundle.min.js';
      expect(console.warn).to.have.been.calledOnce;
      expect(console.warn).to.have.been.calledWith(expectedWarning);
      console.warn.restore();
      mysqlQueryError = null;
    });
  });
});
