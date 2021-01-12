const toBeType = require("jest-tobetype");
expect.extend(toBeType);

const GongoServer = require('gongo-server/lib/serverless').default;

describe('serverless', () => {

  describe('constructor', () => {

    it('sets instance properties', () => {
      const db = {};
      const gs = new GongoServer({ db });

      expect(gs.db).toBe(db);
      expect(gs.publications).toBeType('object');
      expect(gs.methods).toBeType('object');
    });

    it('sets auth and auth gongoServer prop, if auth exists', () => {
      const auth = {};
      const gs = new GongoServer({ db: {}, auth });

      expect(gs.auth).toBe(auth);
      expect(auth.gongoServer).toBe(gs);
    });

  });

  describe('bind', () => {

    it('binds a func to GongoServerless instance', () => {
      const gs = new GongoServer({ db: {} });
      const fn = gs.bind(function() { return [this, arguments] });
      const result = fn('a', 'b');
      expect(result[0]).toBe(gs);
      expect(result[1].length).toBe(2);
      expect(result[1][0]).toBe('a');
      expect(result[1][1]).toBe('b');
    });

  });

  describe('publish', () => {

    it('stores func', () => {
      const gs = new GongoServer({ db: {} });
      const fn = () => {};
      gs.publish('name', fn);
      expect(gs.publications.name).toBe(fn);
    });

  });

  describe('publishExec', () => {

    it('throws on non-existant publication', () => {
      const gs = new GongoServer({ db: {} });
      return expect(gs.publishExec('fn')).rejects.toThrowError('No such publication');
    });

    it('execs publish function with correct params and returns results', async () => {
      const db = { async publishHelper(results) { return results; }  };
      const gs = new GongoServer({ db });

      async function fn(db, opts, updatedAt, auth, req) {
        return { db, opts, updatedAt, auth, req };
      }

      gs.publish('fn', fn);
      const results = await gs.publishExec('fn', 'opts', 'updatedAt', 'auth', 'req');

      expect(results.opts).toBe('opts');
      expect(results.updatedAt).toBe('updatedAt');
      expect(results.auth).toBe('auth');
      expect(results.req).toBe('req');
    });

  });

  describe('processSubs', () => {

    it('returns results', async () => {
      const db = { async publishHelper(results) { return results; }  };
      const gs = new GongoServer({ db });

      const myResult = {};
      async function fn() {
        return [ myResult ];
      }

      gs.publish('fn', fn);
      const opts = {};
      const subs = [ { name: 'fn', opts }];
      const results = await gs.processSubs(subs);

      expect(results.length).toBe(1);
      expect(results[0]).toBeType('object');
      expect(results[0].name).toBe('fn');
      expect(results[0].opts).toBe(opts);
      expect(results[0].results).toBeType('array');
      expect(results[0].results[0]).toBe(myResult);
    });

    it('does not send empty results', async () => {
      const db = { async publishHelper(results) { return results; }  };
      const gs = new GongoServer({ db });

      async function fn(db, opts, updatedAt, auth, req) {
        return [];
      }

      gs.publish('fn', fn);
      const subs = [ { name: 'fn' }];
      const results = await gs.processSubs(subs);

      expect(results.length).toBe(0);
    });

    it('catches and relays errors', async () => {
      const db = { publishHelper: jest.fn()  };
      const gs = new GongoServer({ db });

      async function throwError() {
        throw new Error("error");
      }

      gs.publish('errorSub', throwError);
      const opts = {};
      const subs = [ { name: 'errorSub', opts }];
      const result = (await gs.processSubs(subs))[0];

      // since the publish function will throw an error
      expect(db.publishHelper).not.toHaveBeenCalled();

      expect(result.name).toBe('errorSub');
      expect(result.opts).toBe(opts);
      expect(result.results).not.toBeDefined();
      expect(result.error).toBeType('object');
      expect(result.error.message).toMatch('error');
    });

  });

});
