const {spawn} = require('child_process');
const {isTypescriptProject} = require('./lib/utils');
const {tslintInstalled} = require('./config/project');

if (isTypescriptProject() && !tslintInstalled()) {
  spawn('npm', ['install', '--save-dev', 'tslint'], {stdio: 'inherit'});
}
