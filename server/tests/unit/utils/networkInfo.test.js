const os = require('os');
const { getLocalIP } = require('../../../src/utils/networkInfo');

describe('getLocalIP', () => {
  it('returns a valid IPv4 address', () => {
    const ip = getLocalIP();
    expect(ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
  });

  it('returns 127.0.0.1 when no external interfaces exist', () => {
    jest.spyOn(os, 'networkInterfaces').mockReturnValue({
      lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
    });
    expect(getLocalIP()).toBe('127.0.0.1');
    jest.spyOn(os, 'networkInterfaces').mockRestore();
  });

  it('skips IPv6 interfaces', () => {
    jest.spyOn(os, 'networkInterfaces').mockReturnValue({
      eth0: [
        { family: 'IPv6', address: '::1', internal: false },
        { family: 'IPv4', address: '10.0.0.1', internal: false },
      ],
    });
    expect(getLocalIP()).toBe('10.0.0.1');
    jest.spyOn(os, 'networkInterfaces').mockRestore();
  });
});
