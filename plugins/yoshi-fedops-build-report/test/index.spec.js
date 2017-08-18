'use strict';
const sinonChai = require('sinon-chai');
const chai = require('chai');
const tp = require('test-phases');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
chai.use(sinonChai);
const {expect} = chai;

const successfulFetch = true;
const fetchSpy = sinon.spy(function () {
  return new Promise((resolve, reject) => {
    successfulFetch ? resolve({ok: true}) : reject();
  });
});

const fedopsBundleSize = proxyquire('../index', {
  'node-fetch': fetchSpy // eslint-disable-line
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
  const reportStoreUrl = 'http://someurl';
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

  const getFetchArgs = (bundleName, fileContent, appName = APP_NAME) => {
    return [
      reportStoreUrl,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appName,
          bundleName,
          bundleSize: bundleSize(fileContent)
        })
      }
    ];
  };

  before(() => {
    process.env.FEDOPS_BUILD_REPORT_STORE_URL = reportStoreUrl;
  });

  after(() => {
    delete process.env.FEDOPS_BUILD_REPORT_STORE_URL;
  });

  beforeEach(() => {
    test = tp.create();
    process.chdir(test.tmp);
    clock = sinon.useFakeTimers(timestamp);
  });

  afterEach(() => {
    test.teardown();
    fetchSpy.reset();
    clock.restore();
  });

  it('shouldn\'t do anything if not in team city', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask({inTeamCity: () => false});
    return task().then(() => {
      expect(fetchSpy).not.to.have.been.called;
    });
  });

  it('shouldn\'t do anything if no fedops config found', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent
    });
    const task = createTask({inTeamCity: () => false});
    return task().then(() => {
      expect(fetchSpy).not.to.have.been.called;
    });
  });

  it('should report the size off a single min.js file', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(fetchSpy).to.have.been.calledOnce;
      expect(fetchSpy).to.have.been.calledWith(...getFetchArgs('app.bundle.min.js', someFileContent));
    });
  });

  it('should report the size off a single min.css file', () => {
    test.setup({
      'dist/statics/app.bundle.min.css': cssFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(fetchSpy).to.have.been.calledOnce;
      expect(fetchSpy).to.have.been.calledWith(...getFetchArgs('app.bundle.min.css', cssFileContent));
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
      expect(fetchSpy).to.have.been.calledThrice;
      expect(fetchSpy.getCall(0).args).to.eql(getFetchArgs('a.bundle.min.css', cssFileContent));
      expect(fetchSpy.getCall(1).args).to.eql(getFetchArgs('a.bundle.min.js', someFileContent));
      expect(fetchSpy.getCall(2).args).to.eql(getFetchArgs('b.bundle.min.js', someOtherFileContent));
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
      expect(fetchSpy).to.have.been.calledTwice;
      expect(fetchSpy.getCall(0).args).to.eql(getFetchArgs('b.bundle.min.css', cssFileContent));
      expect(fetchSpy.getCall(1).args).to.eql(getFetchArgs('b.bundle.min.js', someFileContent));
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
      expect(fetchSpy).to.have.been.calledTwice;
      expect(fetchSpy.getCall(0).args).to.eql(getFetchArgs('a.bundle.min.css', cssFileContent));
      expect(fetchSpy.getCall(1).args).to.eql(getFetchArgs('a.bundle.min.js', someFileContent));
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
      expect(fetchSpy).to.have.been.callCount(4);
      expect(fetchSpy.getCall(0).args).to.eql(getFetchArgs('a.bundle.min.css', cssFileContent));
      expect(fetchSpy.getCall(1).args).to.eql(getFetchArgs('a.bundle.min.css', cssFileContent, ANOTHER_APP_NAME));
      expect(fetchSpy.getCall(2).args).to.eql(getFetchArgs('a.bundle.min.js', someFileContent));
      expect(fetchSpy.getCall(3).args).to.eql(getFetchArgs('a.bundle.min.js', someFileContent, ANOTHER_APP_NAME));
    });
  });

  it('should report the appName if no app_name in fedops.json', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"appName": "${APP_NAME}"}`
    });
    const task = createTask();
    return task().then(() => {
      expect(fetchSpy).to.have.been.calledOnce;
      expect(fetchSpy.getCall(0).args).to.eql(getFetchArgs('app.bundle.min.js', someFileContent));
    });
  });

  it('should not do anything if no app_name or appName in fedops.json', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"not_app_name": "${APP_NAME}"}`
    });
    const task = createTask();
    return task().then(() => {
      expect(fetchSpy).not.to.have.been.called;
    });
  });

  it('should still send a report for a valid app', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `[${fedopsJson}, {"not_app_name": "foobar"}]`
    });
    const task = createTask();
    return task().then(() => {
      expect(fetchSpy).to.have.been.calledOnce;
      expect(fetchSpy.getCall(0).args).to.eql(getFetchArgs('app.bundle.min.js', someFileContent));
    });
  });
});
