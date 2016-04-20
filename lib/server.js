import log from './logger';
import { default as baseServer } from 'appium-express';
import { routeConfiguringFunction } from 'mobile-json-wire-protocol';
import { WindowsDriver } from './driver';

async function startServer(port, host) {
    let driver = new WindowsDriver(port, host);
    let router = routeConfiguringFunction(driver);
    let server = baseServer(router, port, host);
    log.info(`WindowsDriver server listening on http://${host}:${port}`);
    return server;
}

export { startServer };
