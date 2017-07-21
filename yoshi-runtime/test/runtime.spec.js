const {expect} = require('chai');
const {cleanMocks, mockEnvironment, mockCI} = require('yoshi-utils').utilsTestkit;
const {create} = require('test-phases');
const {cssModulesPattren} = require('../index');

describe('CSS modules pattern', () => {

  afterEach(() => cleanMocks());

  it('should return short pattern for production mode', () => {
    mockEnvironment({production: true});
    mockCI({ci: false});
    expect(cssModulesPattren()).to.equal(`[hash:base64:5]`);
  });

  it('should return long pattern for local mode', () => {
    mockEnvironment({production: false});
    mockCI({ci: false});
    expect(cssModulesPattren()).to.equal(`[path][name]__[local]__[hash:base64:5]`);
  });

  it('should return short pattern in CI', () => {
    mockEnvironment({production: false});
    mockCI({ci: true});
    expect(cssModulesPattren()).to.equal(`[hash:base64:5]`);
  });
});

describe('CSS modules runtime', () => {
  const generateCssModulesPattern = (name, path, pattern = `[hash:base64:5]`) => {
    const genericNames = require('generic-names');
    const generate = genericNames(pattern, {hashPrefix: 'pkg'});
    return generate(name, path);
  };

  afterEach(() => {
    cleanMocks();
  });

  it('should generate css modules', () => {
    mockEnvironment({production: true});
    const hash = generateCssModulesPattern('a', 'styles/my-file.css');
    const expectedCssMap = `{ a: '${hash}' }\n`;
    const myTest = create('dist/src/index');
    const res = myTest
      .setup({
        'dist/src/index.js': `const {wixCssModulesRequireHook} = require('${require.resolve('../index')}');
          wixCssModulesRequireHook('./dist/src');
          const s = require('./styles/my-file.css')
          console.log(s);
        `,
        'dist/src/styles/my-file.css': `.a {color: red;}`,
        'package.json': '{"name": "pkg"}'
      })
      .execute('');

    expect(res.code).to.equal(0);
    expect(res.stdout).to.equal(expectedCssMap);
    myTest.teardown();
  });

  it('should generate css modules with default rootDir', () => {
    mockEnvironment({production: true});
    const hash = generateCssModulesPattern('a', 'styles/my-file.css');
    const expectedCssMap = `{ a: '${hash}' }\n`;
    const myTest = create('dist/src/index');
    const res = myTest
      .setup({
        'dist/src/index.js': `const {wixCssModulesRequireHook} = require('${require.resolve('../index')}');
          wixCssModulesRequireHook();
          const s = require('./styles/my-file.css')
          console.log(s);
        `,
        'dist/src/styles/my-file.css': `.a {color: red;}`,
        'package.json': '{"name": "pkg"}'
      })
      .execute('');

    expect(res.code).to.equal(0);
    expect(res.stdout).to.equal(expectedCssMap);
    myTest.teardown();
  });

  it('should generate css modules for node_modules', () => {
    mockEnvironment({production: true});
    const hash = generateCssModulesPattern('a', '../node_modules/module/styles/my-file.css');
    const expectedCssMap = `{ a: '${hash}' }\n`;
    const myTest = create('dist/src/index');
    const res = myTest
      .setup({
        'dist/src/index.js': `const {wixCssModulesRequireHook} = require('${require.resolve('../index')}');
          wixCssModulesRequireHook('./dist/src');
          const s = require('module/styles/my-file.css')
          console.log(s);
        `,
        'node_modules/module/styles/my-file.css': `.a {color: red;}`,
        'package.json': '{"name": "pkg"}'
      })
      .execute('');

    expect(res.code).to.equal(0);
    expect(res.stdout).to.equal(expectedCssMap);
    myTest.teardown();
  });
});
