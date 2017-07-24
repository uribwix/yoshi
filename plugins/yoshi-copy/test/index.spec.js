'use strict';

const {expect} = require('chai');
const tp = require('test-phases');
const copy = require('../index');
const path = require('path');

describe('Copy', () => {
  let test;
  let task;

  beforeEach(() => {
    test = tp.create();
    process.chdir(test.tmp);
    task = copy({
      log: a => a,
      base: () => 'src',
      projectConfig: {isEsModule: () => false}
    });
  });
  afterEach(() => test.teardown());

  it('should copy files from assets folder', () => {
    test.setup({
      'app/assets/some-file': 'a',
      'src/assets/some-file': 'a',
      'test/assets/some-file': 'a'
    });

    return task()
      .then(() => {
        expect(test.list('dist/src/assets')).to.include('some-file');
      });
  });

  it('should copy given types', () => {
    test.setup({
      'src/a.ejs': 'a',
      'src/a.html': 'a',
      'src/a.vm': 'a'
    });

    return task()
      .then(() => {
        expect(test.list('dist/src').sort()).to.eql(['a.ejs', 'a.html', 'a.vm']);
      });
  });

  it('should copy nested directories', () => {
    test.setup({
      'src/assets/fonts/some-font': '',
      'src/assets/images/secret/an-image.png': ''
    });

    return task()
      .then(() => {
        expect(test.list('dist/statics/assets', '-R'))
          .to.include('fonts/some-font')
          .and.to.include('images/secret/an-image.png');
      });
  });

  it('should copy files from assets folder into the output dir if specified', () => {
    createFilesInAssetsDirectory();

    return task({output: 'statics1'})
      .then(() => {
        checkAssetsDirectoryCopiedTo('dist/statics1');
      });
  });

  it('should copy html assets to dist and to statics', () => {
    createHtmlAssets();

    return task()
      .then(() => {
        checkHtmlAssetsCopiedTo('dist/statics');
        checkHtmlAssetsCopiedTo('dist/src');
      });
  });

  it('should copy server assets to dist', () => {
    createServerAssets();

    return task()
      .then(() => {
        checkServerAssetsCopiedTo('dist/src');
      });
  });

  describe('when module should emit es version', () => {
    let extendTask;

    beforeEach(() => {
      extendTask = ({watch}) => copy({
        log: a => a,
        base: () => 'src',
        projectConfig: {isEsModule: () => true},
        watch
      });

      createFilesInAssetsDirectory();
      createHtmlAssets();
      createServerAssets();
    });

    describe('but in watch mode', () => {
      beforeEach(() => task = extendTask({watch: true}));

      it('should not copy assets to dist/es', () => {
        return task()
          .then(() => {
            expect(test.contains('dist/es')).to.be.false;
          });
      });
    });

    describe('and not in watch mode', () => {
      beforeEach(() => task = extendTask({watch: false}));

      it('should copy assets to dist/es', () => {
        return task()
          .then(() => {
            checkAssetsDirectoryCopiedTo('dist/es/src');
            checkServerAssetsCopiedTo('dist/es/src');
            checkHtmlAssetsCopiedTo('dist/es/src');
          });
      });
    });
  });

  describe('when in watch mode', () => {
    let extendTask;

    beforeEach(() => {
      extendTask = ({es}) => copy({
        log: a => a,
        base: () => 'src',
        projectConfig: {isEsModule: () => es},
        watch: true
      });

      createFilesInAssetsDirectory();
      createHtmlAssets();
      createServerAssets();
    });

    describe('but module should not emit es version', () => {
      beforeEach(() => task = extendTask({es: true}));

      it('should not copy assets to dist/es', () => {
        return task()
          .then(() => {
            expect(test.contains('dist/es')).to.be.false;
          });
      });
    });
  });

  function createFilesInAssetsDirectory() {
    test.setup({
      'src/assets/some-file': 'a'
    });
  }

  function createHtmlAssets() {
    test.setup({
      'src/index.html': 'a',
      'src/index.vm': 'a',
      'src/index.ejs': 'a'
    });
  }

  function createServerAssets() {
    test.setup({
      'src/style.css': '.a {\ncolor: red;\n}\n',
      'src/some.d.ts': '',
      'src/file.json': '{}'
    });
  }

  function checkAssetsDirectoryCopiedTo(to) {
    const assets = path.join(to, 'assets');
    expect(test.list(assets)).to.include.members([
      'some-file'
    ]);
  }

  function checkServerAssetsCopiedTo(to) {
    expect(test.list(to)).to.include.members([
      'style.css',
      'file.json',
      'some.d.ts'
    ]);
  }

  function checkHtmlAssetsCopiedTo(to) {
    expect(test.list(to)).to.include.members([
      'index.html',
      'index.vm',
      'index.ejs'
    ]);
  }
});
