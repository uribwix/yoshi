#!/usr/bin/env node

const {watchMode} = require('./lib/utils');

if (watchMode()) {
  process.exit(0);
}

const program = require('commander');
const run = require('./lib/run');

program
  .option('--output <dir>', 'output directory for the static assets', 'statics')
  .option('--analyze', 'run webpack-bundle-analyzer plugin')
  .parse(process.argv);

const {build} = require('./lib/yoshi-plugins')(program);
run(build, program);
