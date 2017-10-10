const {loadPackages, loadRootPackage, iter, exec, filters} = require('lerna-script'),
  idea = require('lerna-script-tasks-idea'),
  npmfix = require('lerna-script-tasks-npmfix');

function test(log) {
  if (isTravis()) {
    // print . periodically in travis to generate input and for travis would not kill job
    setInterval(() => console.log('.'), 1000 * 60 * 5).unref();
    // disable progress to not fill output
    log.disableProgress();
    // override mocha reporter for 'mocha-env-reporter'
    process.env['mocha_reporter'] = 'min';
  }

  return iter.forEach(loadPackages(), {log, build: 'test'})((lernaPackage, log) => {
    return Promise.resolve()
      .then(() => exec.script(lernaPackage, {log})('build'))
      .then(() => exec.script(lernaPackage, {log, silent: false})('test'));
  });
}

function prepush(log) {
  const cleanYarnLocks = () => {
    log.info('sync', 'resetting yarn.lock files');
    return iter.parallel(loadPackages(), {log})(pkg => exec.command(pkg)('echo "" > yarn.lock'));
  }

  const syncNvmRc = () => {
    log.info('sync', 'syncing .nvmrc from root to modules');
    return iter.parallel(loadPackages(), {log})(pkg => exec.command(pkg)(`cp ${process.cwd()}/.nvmrc .`));
  }

  return Promise.resolve()
    .then(() => cleanYarnLocks())
    .then(() => syncNvmRc())
    .then(() => npmfix()(log));
}

function clean(log) {
  return exec.command(loadRootPackage(), {log})('lerna clean --yes').then(() => {
    return iter.parallel(loadPackages(), {log})((lernaPackage, log) => {
      const execCmd = cmd => exec.command(lernaPackage, {log})(cmd);
      return Promise.all(['rm -f *.log', 'rm -f yarn.lock', 'rm -rf target', 'rm -f package-lock.json'].map(execCmd));
    });
  });
}

function isTravis(log) {
  return process.env['CI'] !== 'undefined' && process.env['CI'] === 'true';
}

module.exports = {
  clean,
  prepush,
  test,
  idea: idea(),
};
