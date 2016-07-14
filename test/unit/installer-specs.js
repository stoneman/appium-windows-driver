import { downloadWAD } from '../../lib/installer';
import { system } from 'appium-support';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

chai.should();
chai.use(chaiAsPromised);

describe('downloading WAD', () => {
  it('should throw an error if we are not on windows', async () => {
    sinon.stub(system, "isWindows", () => { return false; });
    await downloadWAD().should.be.rejectedWith(/Windows/);
  });
});