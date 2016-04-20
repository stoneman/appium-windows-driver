// transpile:mocha

import WindowsDriver from '../';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);

describe('driver', () => {
  describe('constructor', () => {
    it('calls BaseDriver constructor with opts', () => {
      let driver = new WindowsDriver({ foo: 'bar' });
      driver.should.exist;
      driver.opts.foo.should.equal('bar');
    });
  });

  describe('createSession', () => {
    it('should set sessionId', async () => {
      let driver = new WindowsDriver({ app: 'myapp'}, false);
      await driver.createSession({ cap: 'foo' });

      driver.sessionId.should.exist;
      driver.caps.cap.should.equal('foo');
    });
  });
});
