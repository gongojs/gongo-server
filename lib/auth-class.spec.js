const Auth = require('./auth-class').default;

describe('Auth', () => {

  it('constructor', () => {
    const auth = new Auth('db', 'untrusted');
    expect(auth.db).toBe('db');
    expect(auth.untrusted).toBe('untrusted');
  });

  it('sid', async () => {
    const auth = new Auth('gs', {});
    expect(await auth.sid()).toBe(undefined);

    auth.untrusted.sid = 'sid';
    expect(await auth.sid()).toBe('sid');
  });

  describe('getSessionData', () => {

    it('calls db getSessionData with sid', async () => {
      const gs = { db: { Users: { getSessionData: jest.fn() }}};
      const auth = new Auth(gs, { sid: 'sid' });
      gs.db.Users.getSessionData.mockReturnValueOnce('session');

      const session = await auth.getSessionData();
      expect(gs.db.Users.getSessionData).toHaveBeenCalledWith('sid');
      expect(session).toBe('session');
    });

    it('returns {} on falsey sid', async () => {
      const gs = { db: { Users: { getSessionData: jest.fn() }}};
      const auth = new Auth(gs, { /* no sid */ });
      const session = await auth.getSessionData();
      expect(session).toEqual({});
    });

  });

  describe('setSessionData', () => {

    it('calls db setSessionData with sid', async () => {
      const gs = { db: { Users: { setSessionData: jest.fn() }}};
      const auth = new Auth(gs, { sid: 'sid' });
      gs.db.Users.setSessionData.mockReturnValueOnce('setSessionResult');

      const data = {};
      const returnValue = await auth.setSessionData(data);
      expect(gs.db.Users.setSessionData).toHaveBeenCalledWith('sid', data);
      expect(returnValue).toBe('setSessionResult');
    });

    it('returns null on falsey sid', async () => {
      const gs = { db: { Users: { getSessionData: jest.fn() }}};
      const auth = new Auth(gs, { /* no sid */ });
      const returnValue = await auth.setSessionData();
      expect(returnValue).toBe(null);
    });

  });

  describe('userId', () => {

    it('calls getSessionData and returns userId', async () => {
      const auth = new Auth();
      auth.getSessionData = () => Promise.resolve({ userId: 'userId' });

      expect(await auth.userId()).toBe('userId');
    });

  });


});
