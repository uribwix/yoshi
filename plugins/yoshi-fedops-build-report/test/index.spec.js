'use strict';
const sinonChai = require('sinon-chai');
const chai = require('chai');
const tp = require('test-phases');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
chai.use(sinonChai);
const {expect} = chai;


const graphitePutSpy = sinon.spy();
const graphiteCloseSpy = sinon.spy();
const createClient = ({prefix, port, host, callback}) => {
  return {
    put: (m, v) => {
      graphitePutSpy(`${prefix}.${m} ${v} host=${host} port=${port}`);
      callback();
    },
    close: graphiteCloseSpy
  };
};

const fedopsBundleSize = proxyquire('../index', {
  'graphite-tcp': {createClient} // eslint-disable-line camelcase
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

  const output = (bundleName, fileContent, appName = APP_NAME) => {
    return `wix-bi-tube.root=events_catalog.src=72.app_name=${appName}.bundle_name=${bundleName}.bundle_size ${bundleSize(fileContent)} host=m.wixpress.com port=2003`;
  };

  beforeEach(() => {
    test = tp.create();
    process.chdir(test.tmp);
    clock = sinon.useFakeTimers(timestamp);
  });

  afterEach(() => {
    test.teardown();
    graphitePutSpy.reset();
    graphiteCloseSpy.reset();
    clock.restore();
  });

  it('shouldn\'t do anything if not in team city', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask({inTeamCity: () => false});
    return task().then(() => {
      expect(graphitePutSpy).not.to.have.been.called;
      expect(graphiteCloseSpy).not.to.have.been.called;
    });
  });

  it('shouldn\'t do anything if no fedops config found', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent
    });
    const task = createTask({inTeamCity: () => false});
    return task().then(() => {
      expect(graphitePutSpy).not.to.have.been.called;
      expect(graphiteCloseSpy).not.to.have.been.called;
    });
  });

  it('should report the size off a single min.js file', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).to.have.been.calledOnce;
      expect(graphiteCloseSpy).to.have.been.calledOnce;
      expect(graphitePutSpy).to.have.been.calledWith(output('app_bundle_min_js', someFileContent));
    });
  });

  it('should report the size off a single min.css file', () => {
    test.setup({
      'dist/statics/app.bundle.min.css': cssFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).to.have.been.calledOnce;
      expect(graphiteCloseSpy).to.have.been.calledOnce;
      expect(graphitePutSpy).to.have.been.calledWith(output('app_bundle_min_css', cssFileContent));
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
      expect(graphitePutSpy).to.have.been.calledThrice;
      expect(graphiteCloseSpy).to.have.been.calledThrice;
      expect(graphitePutSpy.getCall(0).args[0]).to.equal(output('a_bundle_min_css', cssFileContent));
      expect(graphitePutSpy.getCall(1).args[0]).to.equal(output('a_bundle_min_js', someFileContent));
      expect(graphitePutSpy.getCall(2).args[0]).to.equal(output('b_bundle_min_js', someOtherFileContent));
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
      expect(graphitePutSpy).to.have.been.calledTwice;
      expect(graphiteCloseSpy).to.have.been.calledTwice;
      expect(graphitePutSpy.getCall(0).args[0]).to.equal(output('b_bundle_min_css', cssFileContent));
      expect(graphitePutSpy.getCall(1).args[0]).to.equal(output('b_bundle_min_js', someFileContent));
    });
  });

  it('should replace dots with underscore in project name', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': JSON.stringify({
        app_name: 'proj.with.dots' // eslint-disable-line camelcase
      }, null, 2)
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).to.have.been.calledOnce;
      expect(graphiteCloseSpy).to.have.been.calledOnce;
      expect(graphitePutSpy).to.have.been.calledWith(output('app_bundle_min_js', someFileContent, 'proj_with_dots'));
    });
  });

  it('should replace dots with underscore in bundle file name', () => {
    test.setup({
      'dist/statics/bundle.with.dots.bundle.min.js': someFileContent,
      'fedops.json': fedopsJson
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).to.have.been.calledOnce;
      expect(graphiteCloseSpy).to.have.been.calledOnce;
      expect(graphitePutSpy).to.have.been.calledWith(output('bundle_with_dots_bundle_min_js', someFileContent));
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
      expect(graphitePutSpy).to.have.been.calledTwice;
      expect(graphiteCloseSpy).to.have.been.calledTwice;
      expect(graphitePutSpy.getCall(0).args[0]).to.equal(output('a_bundle_min_css', cssFileContent));
      expect(graphitePutSpy.getCall(1).args[0]).to.equal(output('a_bundle_min_js', someFileContent));
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
      expect(graphitePutSpy).to.have.callCount(4);
      expect(graphiteCloseSpy).to.have.callCount(4);
      expect(graphitePutSpy.getCall(0).args[0]).to.equal(output('a_bundle_min_css', cssFileContent));
      expect(graphitePutSpy.getCall(1).args[0]).to.equal(output('a_bundle_min_css', cssFileContent, ANOTHER_APP_NAME));
      expect(graphitePutSpy.getCall(2).args[0]).to.equal(output('a_bundle_min_js', someFileContent));
      expect(graphitePutSpy.getCall(3).args[0]).to.equal(output('a_bundle_min_js', someFileContent, ANOTHER_APP_NAME));
    });
  });

  it('should report the appName if no app_name in fedops.json', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"appName": "${APP_NAME}"}`
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).to.have.been.calledOnce;
      expect(graphiteCloseSpy).to.have.been.calledOnce;
      expect(graphitePutSpy).to.have.been.calledWith(output('app_bundle_min_js', someFileContent));
    });
  });

  it('should not do anything if no app_name or appName in fedops.json', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `{"not_app_name": "${APP_NAME}"}`
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).not.to.have.been.called;
      expect(graphiteCloseSpy).not.to.have.been.called;
    });
  });

  it('should still send a report for a valid app', () => {
    test.setup({
      'dist/statics/app.bundle.min.js': someFileContent,
      'fedops.json': `[${fedopsJson}, {"not_app_name": "foobar"}]`
    });
    const task = createTask();
    return task().then(() => {
      expect(graphitePutSpy).to.have.been.calledOnce;
      expect(graphiteCloseSpy).to.have.been.calledOnce;
      expect(graphitePutSpy).to.have.been.calledWith(output('app_bundle_min_js', someFileContent));
    });
  });
});
