import { BaseDriver } from 'appium-base-driver';
import WinAppDriverServer from './winappdriver';
import logger from './logger';

const WINAPPDRIVER_PORT = 4723;

class WindowsDriver extends BaseDriver {
  constructor(opts = {}, shouldValidateCaps = true) {
    super(opts, shouldValidateCaps);
    this.jwpProxyActive = false;
    this.opts.winAppDriverPort = opts.winAppDriverPort || WINAPPDRIVER_PORT;
  }

  async createSession(caps) {
    try {
      // TODO handle otherSessionData for multiple sessions
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
    this.jwpProxyActive = true;
  }

  async initWinAppDriverServer() {
    this.winAppDriver = new WinAppDriverServer({
      app: this.opts.app,
      host: this.opts.host || 'localhost',
      port: this.opts.winAppDriverPort
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
}

export { WindowsDriver };
export default WindowsDriver;