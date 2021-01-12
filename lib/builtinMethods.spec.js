const methods = require('./builtinMethods');

describe('builtinMethods', () => {

  describe('echo', () => {

    it('returns opts', () => {
      const opts = { a: 1, b: 2 };
      expect(methods.echo(null, opts)).toEqual(opts);
    });

  });

  describe('loginWithPassword', () => {
    const loginWithPassword = methods.loginWithPassword;

    it('returns null on falsy user', () => {
      const db = { db: { Users: {} }};

      db.db.Users.getUserWithEmailAndPassword = () => Promise.resolve(null);
      expect(loginWithPassword(db, {})).resolves.toBe(null);

      db.db.Users.getUserWithEmailAndPassword = () => Promise.resolve(false);
      expect(loginWithPassword(db, {})).resolves.toBe(null);

      db.db.Users.getUserWithEmailAndPassword = () => Promise.resolve(undefined);
      expect(loginWithPassword(db, {})).resolves.toBe(null);
    });

    it('returns userId of real user', () => {
      const db = { db: { Users: {
        getUserWithEmailAndPassword: () => Promise.resolve({ _id: 'id' })
      } }};
      const req = { headers: {}, connection: {} };

      expect(loginWithPassword(db, {}, {}, req))
        .resolves.toStrictEqual({ userId: 'id' });
    });

    it('set sessionData with userId, userAgent, ip', async () => {
      const setSessionData = jest.fn();
      const getUserWithEmailAndPassword = () => Promise.resolve({ _id: 'id' });
      const db = { db: { Users: { getUserWithEmailAndPassword, setSessionData } }};

      const auth = { sid: 'sid' };
      const req = { headers: { "user-agent": "user-agent" }, connection: {} };


      req.connection.remoteAddress = '1.1.1.1';
      await loginWithPassword(db, {}, auth, req);

      expect(setSessionData).toHaveBeenCalledWith('sid', {
        ip: req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
        userId: 'id'
      });
    });

    it('set sessionData with x-forwarded-for ip', async () => {
      const setSessionData = jest.fn();
      const getUserWithEmailAndPassword = () => Promise.resolve({ _id: 'id' });
      const db = { db: { Users: { getUserWithEmailAndPassword, setSessionData } }};

      const auth = { sid: 'sid' };
      const req = { headers: { "user-agent": "user-agent" }, connection: {} };

      req.connection.remoteAddress = '1.1.1.1'; // should be ignored
      req.headers['x-forwarded-for'] = '2.2.2.2,3.3.3.3,4.4.4.4';
      await loginWithPassword(db, {}, auth, req);

      expect(setSessionData).toHaveBeenCalledWith('sid', {
        ip: '2.2.2.2',
        userAgent: req.headers["user-agent"],
        userId: 'id'
      });
    });

  });

});
