import wd from 'wd';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { startServer } from '../../lib/server';
chai.should();
chai.use(chaiAsPromised);

const TEST_PORT = 4788;
const TEST_HOST = "localhost";

let server, driver;

describe('Driver', () => {
  before(async () => {
    server = await startServer(TEST_PORT, TEST_HOST);
  });

  after(async () => {
    await server.close();
  });

  beforeEach(async () => {
    driver = wd.promiseChainRemote(TEST_HOST, TEST_PORT);
  });

  it('should run a basic session using a real client', async () => {
    await driver.init({
      app: "Root",
      platformName: "Windows",
      deviceName: "WindowsPC"
    });
    let anyEls = await driver.elementsByXPath("//*");
    anyEls.length.should.be.above(0);
  });
});