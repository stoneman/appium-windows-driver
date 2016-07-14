import events from 'events';
import { JWProxy } from 'appium-base-driver';
import log from './logger';
import { SubProcess } from 'teen_process';
import { getWinAppDriverBinaryPath } from './install';
import { retryInterval } from 'asyncbox';
import { system, fs } from 'appium-support';
import B from 'bluebird';

const REQD_PARAMS = ['app'];
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = "4823"; //  should be non-4723 to avoid conflict on the same box

class WinAppDriver extends events.EventEmitter {
  constructor(opts = {}) {
    const {proxyhost, proxyport, executable, cmdArgs} = opts;
    super();

    for (let req of REQD_PARAMS) {
      if (!opts || !opts[req]) {
        throw new Error(`Option '${req}' is required!`);
      }
      this[req] = opts[req];
    }

    this.proxyHost = proxyhost || DEFAULT_HOST;
    this.proxyPort = proxyport || DEFAULT_PORT;
    this.cmdArgs = cmdArgs;
    this.winappdriver = executable;
    this.proc = null;
    this.executableVerified = false;
    this.state = WinAppDriver.STATE_STOPPED;
    this.jwproxy = new JWProxy({server: this.proxyHost, port: this.proxyPort});
  }

  async startWinAppDriverProcess (caps) {
    this.initWinAppDriverPath();
    return this.start(caps, true);
  }

  async initWinAppDriverPath () {
    if (this.executableVerified) return;
    
    let binPath = this.winappdriver || (await getWinAppDriverBinaryPath());
    if (!await fs.exists(binPath)) {
      throw new Error(`Trying to use a WinAppDriver binary at the path ` +
                      `${binPath}, but it doesn't exist!`);
    }
    this.winappdriverpath = binPath;
    this.executableVerified = true;
    log.info(`Set WinAppDriver binary as: ${this.winappdriverpath}`);
  }

  async start (caps, emitStartingState = true) {

    this.capabilities = caps;
    if (emitStartingState) {
      this.changeState(WinAppDriver.STATE_STARTING);
    }

    // XXXYD TODO: would be better if WinAppDriver didn't require passing in /wd/hub as a param
    let args = [this.proxyPort + "/wd/hub"];

    if (this.cmdArgs) {
      args = args.concat(this.cmdArgs);
    }

    const startDetector = (stdout) => {
      return stdout.indexOf("listening for requests") !== -1;        
    };

    let processIsAlive = false;
    try {
      await this.initWinAppDriverPath();
      await this.killAll();

      // set up our subprocess object
      this.proc = new SubProcess(this.winappdriverpath, args, {
        encoding: 'ucs2'
      });
      processIsAlive = true;

      // handle log output
      for (let stream of ['STDOUT', 'STDERR']) {
        this.proc.on(`lines-${stream.toLowerCase()}`, (lines) => {
          for (let l of lines) {
            log.info(`[${stream}] ${l.trim()}`);
          }
        });
      }

      // handle out-of-bound exit by simply emitting a stopped state
      this.proc.on('exit', (code, signal) => {
        processIsAlive = false;
        if (this.state !== WinAppDriver.STATE_STOPPED &&
            this.state !== WinAppDriver.STATE_STOPPING &&
            this.state !== WinAppDriver.STATE_RESTARTING) {
          let msg = `WinAppDriver exited unexpectedly with code ${code}, ` +
                    `signal ${signal}`;
          log.error(msg);
          this.changeState(WinAppDriver.STATE_STOPPED);
        }
      });
      log.info(`Spawning winappdriver with: ${this.winappdriver} ` +
               `${args.join(' ')}`);

      // start subproc and wait for startDetector
      await this.proc.start(startDetector);

      // XXXYD TODO: bring this back once WinAppDriver supports status correctly
      // await this.waitForOnline();
      await this.startSession();
    } catch (e) {
      this.emit(WinAppDriver.EVENT_ERROR, e);
      // just because we had an error doesn't mean the winappdriver process
      // finished; we should clean up if necessary
      if (processIsAlive) {
        await this.proc.stop();
      }
      log.errorAndThrow(e);
    }
  }      

  sessionId () {
    if (this.state !== WinAppDriver.STATE_ONLINE) {
      return null;
    }

    return this.jwproxy.sessionId;
  }

  async restart () {
    log.info("Restarting WinAppDriver");
    if (this.state !== WinAppDriver.STATE_ONLINE) {
      throw new Error("Can't restart WinAppDriver when we're not online");
    }
    this.changeState(WinAppDriver.STATE_RESTARTING);
    await this.stop(false);
    await this.start(this.capabilities, false);
  }
  
  _statePromise (state = null) {
    return new B((resolve) => {
      const listener = (msg) => {
        if (state === null || msg.state === state) {
          resolve(msg.state);
          this.removeListener(WinAppDriver.EVENT_CHANGED, listener);
        }
      };
      this.on(WinAppDriver.EVENT_CHANGED, listener);
    });
  }

  async waitForOnline () {
    // we need to make sure WAD hasn't crashed
    let winappdriverStopped = false;
    await retryInterval(20, 200, async () => {
      if (this.state === WinAppDriver.STATE_STOPPED) {
        // we are either stopped or stopping, so something went wrong
        winappdriverStopped = true;
        return;
      }
      await this.getStatus();
    });
    if (winappdriverStopped) {
      throw new Error('WinAppDriver crashed during startup.');
    }
  }

  async getStatus () {
    return await this.jwproxy.command('/status', 'GET');
  }

  async startSession(caps) {
    this.proxyReqRes = this.jwproxy.proxyReqRes.bind(this.jwproxy);
    await this.jwproxy.command('/session', 'POST', { desiredCapabilities: this.capabilities });
    this.changeState(WinAppDriver.STATE_ONLINE);
  }

  async stop (emitStates = true) {
    if (emitStates) {
      this.changeState(WinAppDriver.STATE_STOPPING);
    }
    try {
      await this.proc.stop();
      if (emitStates) {
        this.changeState(WinAppDriver.STATE_STOPPED);
      }
    } catch (e) {
      log.error(e);
    }
  }

  changeState (state) {
    this.state = state;
    log.debug(`WinAppDriver changed state to '${state}'`);
    this.emit(WinAppDriver.EVENT_CHANGED, {state});
  }

  async sendCommand (url, method, body) {
    return await this.jwproxy.command(url, method, body);
  }

  async proxyReq (req, res) {
    return await this.jwproxy.proxyReqRes(req, res);
  }

  async killAll () {
    let cmd;
    if (system.isWindows()) {
      // js hint cannot handle backticks, even escaped, within template literals
      cmd = "FOR /F \"usebackq tokens=5\" %a in (`netstat -nao ^| " +
            "findstr /R /C:\"" + this.proxyPort + " \"`) do (" +
            "FOR /F \"usebackq\" %b in (`TASKLIST /FI \"PID eq %a\" ^| " +
            "findstr /I winappdriver.exe`) do (IF NOT %b==\"\" TASKKILL " +
            "/F /PID %a))";
    }
    log.info(`Killing any old WinAppDrivers, running: ${cmd}`);
    try {
      await (B.promisify(cp.exec))(cmd);
      log.info("Successfully cleaned up old WinAppDrivers");
    } catch (err) {
      log.info("No old WinAppDrivers seemed to exist");
    }
  }

  async deleteSession() {
    log.debug('Deleting WinAppDriver server session');
    // rely on jwproxy's intelligence to know what we're talking about and
    // delete the current session
    try {
      await this.jwproxy.command('/', 'DELETE');
    } catch (err) {
      log.warn(`Did not get confirmation WinAppDriver deleteSession worked; ` +
        `Error was: ${err}`);
    }
  }
}

WinAppDriver.EVENT_ERROR = 'winappdriver_error';
WinAppDriver.EVENT_CHANGED = 'stateChanged';
WinAppDriver.STATE_STOPPED = 'stopped';
WinAppDriver.STATE_STARTING = 'starting';
WinAppDriver.STATE_ONLINE = 'online';
WinAppDriver.STATE_STOPPING = 'stopping';
WinAppDriver.STATE_RESTARTING = 'restarting';

export default WinAppDriver;
