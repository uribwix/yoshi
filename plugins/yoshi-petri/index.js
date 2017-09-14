'use strict';

// TODO: consider multiple modules
// TODO: figure out if we need definition files

const path = require('path');
const petriSpecs = require('petri-specs/lib/petri-specs');

function runWatch() {
  // TODO: implement watch mode using chokidar
  return Promise.resolve();
}

module.exports = ({watch, statics}) => {
  const directory = 'petri-specs';
  const json = path.join(statics(), 'petri-experiments.json');

  function runBuild() {
    const options = {directory, json};
    petriSpecs.build(options);

    return Promise.resolve();
  }

  function petri() {
    return watch ? runWatch() : runBuild();
  }

  return petri;
};
