let originalEnv = Object.assign({}, process.env);
const mockery = require('mockery');
module.exports.cleanMocks = () => {
  process.env = originalEnv;
  mockery.disable();
  mockery.deregisterAll();
};

module.exports.mockEnvironment = ({production} = {production: true}) => {
  if (production) {
    process.env.NODE_ENV = 'production';
  } else {
    delete process.env.NODE_ENV;
  }
};

module.exports.mockCI = ({ci} = {ci: true}) => {
  mockery.enable();
  mockery.registerMock('is-ci', ci);
};
