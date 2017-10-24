'use strict';

const {expect} = require('chai');
const tp = require('test-phases');
const petri = require('../index');
const intercept = require('intercept-stdout');
const stripAnsi = require('strip-ansi');
const petriSpecsTestkit = require('petri-specs/test/testkit');
const petriTestUtils = require('petri-specs/test/test-utils');

describe('Petri', () => {
  let test;
  let task;
  let stdout = '';
  let cleanup;

  before(() => cleanup = intercept(s => {
    stdout += stripAnsi(s);
  }));
  beforeEach(() => test = tp.create());
  beforeEach(() => process.chdir(test.tmp));
  beforeEach(() => task = ({petriSpecsConfig = {}} = {}) =>
    petri({
      watch: false,
      statics: () => 'statics',
      projectConfig: {petriSpecsConfig: () => petriSpecsConfig},
    })());

  afterEach(() => test.teardown());
  afterEach(() => stdout = '');
  after(() => cleanup());

  it('should create petri-experiments.json file inside dist/statics folder', () => {
    test.setup(petriSpecsTestkit.baseFsWith({
      'petri-specs/specs.infra.Dummy.json': JSON.stringify(petriSpecsTestkit.spec('specs.infra.Dummy'))
    }));

    return task()
      .then(() => {
        expect(stdout).not.to.contain('Warning: yoshi-petri converted');
        expect(test.list('statics', '-R')).to.contain('petri-experiments.json');
      });
  });

  it('should create petri-experiments.json from translation keys with config', () => {
    test.setup(petriSpecsTestkit.baseFsWith({
      'src/assets/messages_en.json': JSON.stringify(petriSpecsTestkit.translationWithSpecs('translation1'))
    }));

    return task({
      petriSpecsConfig: {
        scopes: ['alt-scope', 'alt-scope2'],
        onlyForLoggedInUsers: false
      }})
      .then(() => {
        expect(stdout).not.to.contain('Warning: yoshi-petri converted');
        expect(test.list('statics', '-R')).to.contain('petri-experiments.json');
        expect(JSON.parse(test.content('statics/petri-experiments.json'))).to.eql(Object.assign({},
          petriSpecsTestkit.translationSpec('specs.abTranslate.alt-scope.translation1', petriTestUtils.and({scopes: ['alt-scope', 'alt-scope2'], onlyForLoggedInUsers: false}))
        ));
      });
  });

  it('should reject Promise when converting deprecated json files', () => {
    const errorMessage = `Error: yoshi-petri detected 1 deprecated specs that got converted. More info: https://github.com/wix-private/petri-specs/docs/CONVERT_SPECS.md`;

    test.setup(petriSpecsTestkit.baseFsWith({
      'petri-specs/specs.infra.Dummy.json': JSON.stringify(petriSpecsTestkit.singleScopeSpec('specs.infra.Dummy'))
    }));

    return new Promise((resolve, reject) =>
      task().then(reject, err => {
        expect(stdout).to.contain(errorMessage);
        expect(err).to.contain(errorMessage);
        expect(test.list('statics', '-R')).to.contain('petri-experiments.json');
        resolve();
      })
    );
  });

  it.skip('should do nothing if there is no petri-specs installed', () => {
    // TODO: figure out how to simulate module doesn't exist in registry
  });
});
