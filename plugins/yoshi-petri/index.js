'use strict';

// TODO: consider multiple modules
// TODO: figure out if we need definition files

const path = require('path');
const petriSpecs = require('petri-specs/lib/petri-specs');
const chalk = require('chalk');

function runWatch() {
  // TODO: implement watch mode using chokidar
  return Promise.resolve();
}

module.exports = ({watch, statics, projectConfig}) => {
  const directory = 'petri-specs';
  const json = path.join(statics(), 'petri-experiments.json');
  const petriSpecsConfig = projectConfig.petriSpecsConfig();

  function runBuild() {
    const options = Object.assign({directory, json}, petriSpecsConfig);
    const {convertedFilesCount} = petriSpecs.convert(options);
    petriSpecs.build(options);

    if (convertedFilesCount > 0) {
      console.warn(chalk.yellow(`Warning: yoshi-petri converted ${convertedFilesCount} deprecated specs to the new format. Please verify, commit and push those files before 01/11/2017. More info: https://github.com/wix-private/petri-specs/docs/CONVERT_SPECS.md`));
    }

    return Promise.resolve();
  }

  function petri() {
    return watch ? runWatch() : runBuild();
  }

  return petri;
};
