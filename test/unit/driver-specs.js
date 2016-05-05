// transpile:mocha

import WindowsDriver from '../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

chai.should();
chai.use(chaiAsPromised);

describe('driver.js', () => {
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
      sinon.mock(driver).expects('startWinAppDriverSession')
          .once()
          .returns(Promise.resolve());
      await driver.createSession({ cap: 'foo' });
      driver.sessionId.should.exist;
      driver.caps.cap.should.equal('foo');
    });

    // TODO: Implement or delete
    //it('should set the default context', async () => {
    //  let driver = new SelendroidDriver({}, false);
    //  sinon.mock(driver).expects('checkAppPresent')
    //    .returns(Promise.resolve());
    //  sinon.mock(driver).expects('startSelendroidSession')
    //    .returns(Promise.resolve());
    //  await driver.createSession({});
    //  driver.curContext.should.equal('NATIVE_APP');
    //});
  });

  describe('proxying', () => {
    let driver;
    before(() => {
      driver = new WindowsDriver({}, false);
      driver.sessionId = 'abc';
    });
    describe('#proxyActive', () => {
      it('should exist', () => {
        driver.proxyActive.should.be.an.instanceof(Function);
      });
      it('should return true', () => {
        driver.proxyActive('abc').should.be.true;
      });
      it('should throw an error if session id is wrong', () => {
        (() => { driver.proxyActive('aaa'); }).should.throw;
      });
    });

    // TODO: Implement or delete  
    //describe('#getProxyAvoidList', () => {
    //  it('should exist', () => {
    //    driver.getProxyAvoidList.should.be.an.instanceof(Function);
    //  });
    //  it('should return jwpProxyAvoid array', () => {
    //    let avoidList = driver.getProxyAvoidList('abc');
    //    avoidList.should.be.an.instanceof(Array);
    //    avoidList.should.eql(driver.jwpProxyAvoid);
    //  });
    //  it('should throw an error if session id is wrong', () => {
    //    (() => { driver.getProxyAvoidList('aaa'); }).should.throw;
    //  });
    //});

    describe('#canProxy', () => {
      it('should exist', () => {
        driver.canProxy.should.be.an.instanceof(Function);
      });
      it('should return true', () => {
        driver.canProxy('abc').should.be.true;
      });
      it('should throw an error if session id is wrong', () => {
        (() => { driver.canProxy('aaa'); }).should.throw;
      });
    });
  });
});
