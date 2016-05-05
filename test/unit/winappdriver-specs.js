// transpile:mocha

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import WinAppDriverServer from '../../lib/winappdriver';
import { withMocks } from 'appium-test-support';

chai.should();
chai.use(chaiAsPromised);

function buildWinAppDriverOpts() {
  return {
    app: 'foo',
    host: 'localhost',
    port: 4723
  };
}

describe('WinAppDriverServer', () => {
  describe('#constructor', () => {
    it('should complain if required options not sent foo', () => {
      (() => {
        new WinAppDriverServer();
      }).should.throw(/Option.*app.*required/);
      (() => {
        new WinAppDriverServer({});
      }).should.throw(/Option.*app.*required/);
      (() => {
        new WinAppDriverServer({ app: 'foo' });
      }).should.throw(/Option.*host.*required/);
      (() => {
        new WinAppDriverServer({ app: 'foo', host: 'bar' });
      }).should.throw(/Option.*port.*required/);
    });
  });

  describe('#startSession', withMocks({ }, (mocks, S) => {
    let winAppDriver = new WinAppDriverServer(buildWinAppDriverOpts());

    it('should wait for status, and start a session', async () => {
      let caps = { foo: 'bar' };
      mocks.jwproxy = S.sandbox.mock(winAppDriver.jwproxy);
      mocks.jwproxy.expects("command").once()
        .withExactArgs("/status", "GET")
        .returns(Promise.resolve());
      mocks.jwproxy.expects("command").once()
        .withExactArgs("/session", "POST", { desiredCapabilities: caps })
        .returns(Promise.resolve());
      await winAppDriver.startSession(caps);
      mocks.adb.verify();
      mocks.jwproxy.verify();
    });

    it('should wait for selendroid to respond to /status', async () => {
      let caps = { foo: 'bar' };
      mocks.jwproxy = S.sandbox.mock(winAppDriver.jwproxy);
      mocks.jwproxy.expects("command").once()
        .withExactArgs("/status", "GET")
        .returns(Promise.reject(new Error("nope")));
      mocks.jwproxy.expects("command").once()
        .withExactArgs("/status", "GET")
        .returns(Promise.resolve());
      mocks.jwproxy.expects("command").once()
        .withExactArgs("/session", "POST", { desiredCapabilities: caps })
        .returns(Promise.resolve());
      await winAppDriver.startSession(caps);
      mocks.adb.verify();
      mocks.jwproxy.verify();
    });
  }));
});

