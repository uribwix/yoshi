'use strict';

const _ = require('lodash/fp');
const path = require('path');
const namoey = require('namoey');
const generatorWixJs = require('../generators/app');

describe('generator-yoshi', function () {
  this.timeout(900 * 1000);
  let namoeyInstance;

  const defaultParams = {
    authorName: 'master-author-name',
    authorEmail: 'master-author-email',
    description: 'master-description',
    keywords: 'master-keywords',
    preprocessor: 'js',
    askAgain: false
  };

  const outputFolder = path.join(process.cwd(), 'generated-examples');

  const getNamoyInstance = (prompts, opts = {useYarn: true}) => {
    const installCmd = opts.useYarn ? 'yarn install --no-lockfile' : 'npm install';

    const normalizedName = [
      'autogenerated',
      prompts.projectsType,
      prompts.clientProjectsType,
      prompts.preprocessor
    ]
      .filter(_.identity)
      .join('-')
      .replace(/\s/g, '-');

    const outputDir = path.join(outputFolder, normalizedName);

    return namoey({silent: false})
      .setGenerators([
        {namespace: 'yoshi', generator: generatorWixJs}
      ])
      .setShellCommands([
        'nvm use --silent || nvm install || exit 0',
        installCmd,
        'npm run build',
        'npm run test'
      ])
      .setDirectory(outputDir)
      .setPrompts(_.mergeAll([defaultParams, {name: normalizedName}, prompts]));
  };

  describe('fullstack', () => {
    beforeEach(() => {
      namoeyInstance = getNamoyInstance({
        projectsType: 'fullstack'
      });
    });

    it('should be fine for fullstack javascript generation', () =>
      namoeyInstance.createRunner().run('yoshi')
    );
  });

  describe('client', () => {
    beforeEach(() => {
      namoeyInstance = getNamoyInstance({
        projectsType: 'client',
        clientProjectsType: 'react'
      });
    });

    it('should be fine for client generation', () =>
      namoeyInstance.createRunner().run('yoshi')
    );
  });
});

