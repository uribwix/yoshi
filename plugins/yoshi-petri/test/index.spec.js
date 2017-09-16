'use strict';

const {expect} = require('chai');
const tp = require('test-phases');
const petri = require('../index');

describe('Petri', () => {
  let test;
  let task;

  beforeEach(() => test = tp.create());
  beforeEach(() => process.chdir(test.tmp));
  beforeEach(() => task = petri({logIf: a => a, watch: false, statics: () => 'statics'}));

  afterEach(() => test.teardown());

  it('should create petri-experiments.json file inside dist/statics folder', () => {
    test.setup({
      'petri-specs/specs.infra.Dummy.json': `
        {
          "specs.infra.Dummy": {
            "scopes": ["infra"],
            "owner": "tomasm@wix.com",
            "onlyForLoggedInUsers": true,
            "controlGroup": "false",
            "variants": ["true"]
          }
        }`
    });

    return task()
      .then(() => {
        expect(test.list('statics', '-R')).to.contain('petri-experiments.json');
      });
  });

  it.skip('should do nothing if there is no petri-specs installed', () => {
    // TODO: figure out how to simulate module doesn't exist in registry
  });
});
