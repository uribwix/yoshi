'use strict';

const chai = require('chai');
const tp = require('test-phases');
const stripAnsi = require('strip-ansi');
const intercept = require('intercept-stdout');
const typescript = require('../index');
const chaiAsPromised = require('chai-as-promised');
const {expect} = chai;

chai.use(chaiAsPromised);

const tsconfig = JSON.stringify({
  compilerOptions: {
    module: 'commonjs',
    target: 'es5',
    moduleResolution: 'node',
    sourceMap: true,
    outDir: 'dist',
    declaration: true,
    noImplicitAny: false
  },
  exclude: [
    'node_modules',
    'dist'
  ]
}, null, 2);

describe('Typescript', () => {
  let test;
  let cleanup;
  let stdout = '';

  before(() => cleanup = intercept(s => {
    stdout += stripAnsi(s);
  }));
  beforeEach(() => test = tp.create());
  beforeEach(() => process.chdir(test.tmp));
  const identity = x => x;

  afterEach(() => test.teardown());
  afterEach(() => stdout = '');
  after(() => cleanup());

  it('should transpile to dist', () => {
    test.setup({
      'app/a.ts': 'const a = 1;',
      'app/b.tsx': 'const b = 2',
      'tsconfig.json': tsconfig
    });

    return typescript({watch: false, log: identity})()
      .then(() => {
        expect(test.content('dist/app/a.js')).to.contain('var a = 1');
        expect(test.content('dist/app/b.js')).to.contain('var b = 2');
      });
  });

  it('should create source maps and definition files side by side', () => {
    test.setup({
      'app/a.ts': 'const b = 2;',
      'tsconfig.json': tsconfig
    });

    return typescript({watch: false, log: identity})()
      .then(() => {
        expect(test.content('dist/app/a.js')).to.contain('//# sourceMappingURL=a.js.map');
        expect(test.list('dist/app')).to.include('a.js.map', 'a.d.ts');
      });
  });

  it('should resolve when exist code is 0', () => {
    test.setup({
      'src/a.ts': 'const a = 1',
      'tsconfig.json': tsconfig
    });

    const pluginP = typescript({watch: false, log: identity})();
    return expect(pluginP).to.be.fulfilled;
  });

  it('should resolve when it is in watch mode and there are no errors', () => {
    test.setup({
      'src/a.ts': 'const a = 1',
      'tsconfig.json': tsconfig
    });

    const pluginP = typescript({watch: true, log: identity})();
    return expect(pluginP).to.be.fulfilled;
  });

  it('should not reject when there is a typescript error on watch mode', () => {
    test.setup({
      'src/a.ts': 'function ()',
      'tsconfig.json': tsconfig
    });

    const pluginP = typescript({watch: true, log: identity})();
    return expect(pluginP).to.not.be.rejected;
  });

  it('should reject when there is a typescript error and not in watch mode', () => {
    test.setup({
      'src/a.ts': 'function ()',
      'tsconfig.json': tsconfig
    });

    const pluginP = typescript({watch: false, log: identity})();
    expect(pluginP).to.be.rejected;
    return pluginP
      .catch(() => {
        expect(stdout).to.contain('error TS');
      });
  });

  it('should reject if tsc exit code is not 0', () => {
    test.setup({
      'src/a.ts': 'function ()',
      'tsconfig.json': tsconfig
    });

    const pluginP = typescript({watch: false, log: identity})();
    return expect(pluginP).to.be.rejected;
  });
});
