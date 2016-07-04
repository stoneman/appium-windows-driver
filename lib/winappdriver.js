import { JWProxy } from 'appium-base-driver';
import logger from './logger';

const REQD_PARAMS = ['app', 'host', 'port'];

class WinAppDriverServer {
  constructor(opts = {}) {
    for (let req of REQD_PARAMS) {
      if (!opts || !opts[req]) {
        throw new Error(`Option '${req}' is required!`);
      }
      this[req] = opts[req];
    }

    this.jwproxy = new JWProxy({ server: this.host, port: this.port });
    this.proxyReqRes = this.jwproxy.proxyReqRes.bind(this.jwproxy);
  }

  async startSession(caps) {
    await this.jwproxy.command('/session', 'POST', { desiredCapabilities: caps });
  }

  async deleteSession() {
    logger.debug('Deleting WinAppDriver server session');
    // rely on jwproxy's intelligence to know what we're talking about and
    // delete the current session
    try {
      await this.jwproxy.command('/', 'DELETE');
    } catch (err) {
      logger.warn(`Did not get confirmation WinAppDriver deleteSession worked; ` +
        `Error was: ${err}`);
    }
  }
}

export default WinAppDriverServer;