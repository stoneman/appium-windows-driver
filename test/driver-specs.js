// transpile:mocha

import WindowsDriver from '../';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);

describe('driver', () => {
  it('should instantiate class', () => {
    let driver = new WindowsDriver();
    driver.should.exist;
  });
});
