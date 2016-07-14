import log from './logger';
import { server as baseServer, routeConfiguringFunction  } from 'appium-base-driver';
import { WindowsDriver } from './driver';

async function startServer(port, host) {
    let driver = new WindowsDriver({port, host});
    let router = routeConfiguringFunction(driver);
    let server = baseServer(router, port, host);
    log.info(`WindowsDriver server listening on http://${host}:${port}`);
    return server;
}

export { startServer };
