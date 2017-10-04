const {loadPackages, loadRootPackage, iter, exec, filters} = require('lerna-script'),
  idea = require('lerna-script-tasks-idea'),
  npmfix = require('lerna-script-tasks-npmfix');

/* Run tests for all modules */
function test() {
  return log => iter.forEach(loadPackages(), {log, build: 'test'})((lernaPackage, log) => {
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

module.exports = {
  clean,
  prepush,
  test: test(),
  idea: idea(),
};