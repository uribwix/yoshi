'use strict';

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const fetch = require('node-fetch');

const fsStatP = filePath => new Promise((resolve, reject) => {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      reject(err);
    } else {
      resolve(stats);
    }
  });
});

const tryRequire = name => {
  try {
    return require(name);
  } catch (ex) {
    return null;
  }
};

const globAsync = (patter, options) => new Promise((resolve, reject) => {
  glob(patter, options, (err, matches) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(matches);
  });
});

const getBundleNames = () => {
  return globAsync(path.resolve(process.cwd(), 'dist/statics/*.min.@(js|css)'));
};

const getShortBundleName = bundleName => {
  return path.relative(path.join(process.cwd(), 'dist/statics'), bundleName);
};

const reportBundleSize = params => {
  return new Promise(resolve => {
    return fsStatP(path.resolve(process.cwd(), params.bundleName))
      .then(stats => {
        const bundleName = getShortBundleName(params.bundleName);
        const url = process.env.FEDOPS_BUILD_REPORT_STORE_URL;
        const options = {
          method: 'post',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            appName: params.appName,
            bundleName: bundleName,
            bundleSize: stats.size || 0
          })
        };
        fetch(url, options)
          .then(response => {
            if (!response.ok) {
              throw new Error('Server side error.');
            }

            resolve();
          })
          .catch(err => {
            console.warn(`Bundle size save failed. ${err.message} App: ${params.appName}. Bundle: ${bundleName}.bundle.min.js.`);
            resolve();
          });
      })
      .catch(err => {
        console.warn(`Error code ${err.code}. Failed to find size of file ${params.bundleName}.bundle.min.js.`);
        resolve();
      });
  });
};

const reportBundleForApp = bundleName => fedopsJson => {
  const appName = fedopsJson.app_name || fedopsJson.appName;
  const params = {
    appName,
    bundleName
  };

  if (!appName) {
    console.warn('fedops.json is missing "app_name" field');
    return Promise.resolve();
  }

  return reportBundleSize(params);
};

const sendStream = config => bundleName => {
  const promises = [].concat(config).map(reportBundleForApp(bundleName));
  return Promise.all(promises);
};

module.exports = ({log, inTeamCity}) => {
  function fedopsBundleSize() {
    if (!inTeamCity()) {
      return Promise.resolve();
    }

    const config = tryRequire(path.join(process.cwd(), 'fedops.json'));

    if (!config) {
      return Promise.resolve();
    }

    return getBundleNames()
      .then(bundleNames => {
        return Promise.all(bundleNames.map(sendStream(config)));
      })
      .catch(e => {
        console.warn('Bundle size report error:', e);
        return Promise.resolve();
      });
  }

  return log(fedopsBundleSize);
};
