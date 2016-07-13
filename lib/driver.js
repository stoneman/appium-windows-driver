import { BaseDriver } from 'appium-base-driver';
import WinAppDriver from './winappdriver';
import logger from './logger';

const WINAPPDRIVER_PORT = 4723;
const WINAPPDRIVER_HOST = "localhost";

// Appium instantiates this class
class WindowsDriver extends BaseDriver {
  constructor(opts = {}, shouldValidateCaps = true) {
    super(opts, shouldValidateCaps);
    this.jwpProxyActive = false;
    this.opts.port = opts.port || WINAPPDRIVER_PORT;
    this.opts.host = opts.host || WINAPPDRIVER_HOST;
  }

  async createSession(caps) {
    try {
      let sessionId;
      [sessionId] = await super.createSession(caps);
      await this.startWinAppDriverSession();
      return [sessionId, caps];
    } catch (e) {
      await this.deleteSession();
      throw e;
    }
  }

  async startWinAppDriverSession() {
    await this.initWinAppDriverServer();
    await this.winAppDriver.startSession(this.caps);
    // now that everything has started successfully, turn on proxying so all
    // subsequent session requests go straight to/from WinAppDriver
    this.jwpProxyActive = true;
  }

  async initWinAppDriverServer() {
    this.winAppDriver = new WinAppDriver({
      app: this.opts.app
    });
    await this.winAppDriver.startWinAppDriverProcess(this.caps);
    this.proxyReqRes = this.winAppDriver.proxyReqRes.bind(this.winAppDriver);
  }

  async deleteSession() {
    logger.debug('Deleting WinAppDriver session');

    if (this.winAppDriver) {
      if (this.jwpProxyActive) {
        await this.winAppDriver.deleteSession();
      }
    }
    this.jwpProxyActive = false;

    await super.deleteSession();

    // XXXYD: Seems wrong to clear out the winAppDriver server instance here doesn't it?
    // shouldn't we leave the process up?  Worth investigating.  
    await this.winAppDriver.stop();  
    this.winAppDriver = null;         
  }

  proxyActive(sessionId) {
    super.proxyActive(sessionId);

    // we always have an active proxy to the WinAppDriver server
    return true;
  }

  canProxy(sessionId) {
    super.canProxy(sessionId);

    // we can always proxy to the WinAppDriver server
    return true;
  }
}

export { WindowsDriver };
export default WindowsDriver;