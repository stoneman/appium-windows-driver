import { BaseDriver } from 'appium-base-driver';
import WinAppDriverServer from './winappdriver';
import logger from './logger';

const WINAPPDRIVER_PORT = 4723;

class WindowsDriver extends BaseDriver {
  constructor(opts = {}, shouldValidateCaps = true) {
    super(opts, shouldValidateCaps);
    this.jwpProxyActive = false;
    this.opts.port = opts.port || WINAPPDRIVER_PORT;
    this.opts.host = opts.host || "localhost";
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
    this.winAppDriver = new WinAppDriverServer({
      app: this.opts.app,
      host: this.opts.host, 
      port: this.opts.port
    });
    this.proxyReqRes = this.winAppDriver.proxyReqRes.bind(this.winAppDriver);
  }

  async deleteSession() {
    logger.debug('Deleting WinAppDriver session');
    if (this.winAppDriver) {
      if (this.jwpProxyActive) {
        await this.winAppDriver.deleteSession();
      }
      this.winAppDriver = null;
    }
    this.jwpProxyActive = false;

    await super.deleteSession();
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