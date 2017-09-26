'use strict';

const {expect} = require('chai');
const tp = require('test-phases');
const petri = require('../index');
const intercept = require('intercept-stdout');
const stripAnsi = require('strip-ansi');

function pom() {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
      <modelVersion>4.0.0</modelVersion>
      <groupId>com.wixpress</groupId>
      <artifactId>yoshi</artifactId>
      <version>1.0.0-SNAPSHOT</version>
      <name>yoshi</name>
      <description>yoshi</description>
      <packaging>pom</packaging>

      <parent>
          <groupId>com.wixpress.common</groupId>
          <artifactId>wix-master-parent</artifactId>
          <version>100.0.0-SNAPSHOT</version>
      </parent>

      <developers>
          <developer>
              <name>Lior Belinksy</name>
              <email>liorbe@wix.com</email>
              <roles>
                  <role>owner</role>
              </roles>
          </developer>
      </developers>
  </project>
  `;
}

function baseFsWith(files = {}) {
  return Object.assign({
    'package.json': '',
    'pom.xml': pom()
  }, files);
}

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
  beforeEach(() => task = petri({watch: false, statics: () => 'statics'}));

  afterEach(() => test.teardown());
  afterEach(() => stdout = '');
  after(() => cleanup());

  it('should create petri-experiments.json file inside dist/statics folder', () => {
    test.setup(baseFsWith({
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
    }));

    return task()
      .then(() => {
        expect(stdout).not.to.contain('Warning: yoshi-petri converted');
        expect(test.list('statics', '-R')).to.contain('petri-experiments.json');
      });
  });

  it('should warn when converting deprecated json files', () => {
    test.setup(baseFsWith({
      'petri-specs/specs.infra.Dummy.json': `
          {
            "specs.infra.Dummy": {
              "scope": "infra",
              "owner": "tomasm@wix.com",
              "onlyForLoggedInUsers": true,
              "testGroups": ["false", "true"]
            }
          }`
    }));

    return task()
      .then(() => {
        expect(stdout).to.contain('Warning: yoshi-petri converted 1 deprecated specs to the new format. Please verify, commit and push those files before 01/11/2017. More info: https://github.com/wix-private/petri-specs/docs/CONVERT_SPECS.md');
        expect(test.list('statics', '-R')).to.contain('petri-experiments.json');
      });
  });

  it.skip('should do nothing if there is no petri-specs installed', () => {
    // TODO: figure out how to simulate module doesn't exist in registry
  });
});
