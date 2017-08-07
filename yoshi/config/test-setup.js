'use strict';

const path = require('path');
const {tryRequire, isTypescriptProject} = require('../lib/utils');

const ext = isTypescriptProject() && !process.env.IN_WALLABY ? 'ts' : 'js';
const mochaSetupPath = path.join(process.cwd(), 'test', `mocha-setup.${ext}`);
const setupPath = path.join(process.cwd(), 'test', `setup.${ext}`);

if (!process.env.IN_WALLABY) {
  require('../lib/require-hooks');
}

require('../lib/ignore-extensions');
tryRequire(mochaSetupPath);
tryRequire(setupPath);
