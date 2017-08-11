#!/usr/bin/env node

const spawn = require('cross-spawn');
const {suffix, watchMode} = require('./lib/utils');

watchMode(true);

const program = require('commander');
const run = require('./lib/run');

program
  .option('-e, --entry-point <entry>', 'entry point of the application', suffix('.js'), 'index.js')
  .option('-n, --no-server', 'run without starting entry-point')
  .option('--manual-restart', 'get SIGHUP on change and manage application reboot manually', false)
  .parse(process.argv);

const runServer = require('./lib/tasks/run-server');
const serverConf = {entryPoint: program.entryPoint, manualRestart: program.manualRestart};
const restartServer = () => program.server && runServer(serverConf);
Object.assign(program, {done: restartServer});

const {start} = require('./lib/yoshi-plugins')(program);
run(start, program).then(() => spawn('npm', ['test', '--silent'], {stdio: 'inherit'}));
