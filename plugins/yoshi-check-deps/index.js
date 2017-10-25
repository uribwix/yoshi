const chalk = require('chalk');
const depkeeper = require('depkeeper');

// const registryUrl = `http://repo.dev.wixpress.com/artifactory/api/npm/npm-repos/`;

function checkDeps() {
  return depkeeper()
    .rule('yoshi', {major: 1})
    .rule('yoshi', {major: 0, minor: 0, patch: 0})
    .checkRules()
    .then(([outdated1, outdated2]) => {
      if (outdated1.length) {
        return fail(outdated1);
      } else if (outdated2.length) {
        return warn(outdated2);
      }
    });
}

function fail(deps) {
  const formatedDeps = deps.map(({name, version, minimal}) =>
    chalk`${name}{redBright @${version}} must be {greenBright @${minimal}}`).join('\n');
  const message = chalk`{red ERROR: the following dependencies must be updated:\n}${formatedDeps}`;
  return Promise.reject(message);
}

function warn(deps) {
  const formatedDeps = deps.map(({name, version, minimal}) =>
    chalk`${name}{yellowBright @${version}} should be {greenBright @${minimal}}`).join('\n');
  const message = chalk`{yellow WARNING: some dependencies are a bit behind:\n}${formatedDeps}`;
  console.log(message);
  return Promise.resolve(message);
}

module.exports = ({log}) => log(checkDeps);
