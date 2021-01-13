const ARSON = require('arson');
const toBeType = require("jest-tobetype");
expect.extend(toBeType);

jest.mock('bcrypt');
const bcrypt = require('bcrypt');

const Auth = require('./auth-class').default;
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

  describe('processMethods', () => {

    it('returns array of methods results from all args', async () => {
      const methods = [
        { name: 'a', id: 'a', opts: { x: 1, y: 2 } },
        { name: 'b', id: 'b', opts: { x: 2, y: 1 } },
      ];

      const auth = {}, req = {};
      const gs = new GongoServer({ db: {} });
      gs.methods.a = gs.methods.b = (gs, opts, auth, req) => ({ gs, opts, auth, req });

      const results = await gs.processMethods(methods, auth, req);
      expect(results).toBeType('array');
      expect(results.length).toBe(2);
      expect(results[0]).toStrictEqual({ id: 'a', result: { auth, gs, opts: methods[0].opts, req } });
      expect(results[1]).toStrictEqual({ id: 'b', result: { auth, gs, opts: methods[1].opts, req } });
    });

    it('passes error for no such method', async () => {
      const methods = [ { name: 'a', id: 'a' } ];
      const gs = new GongoServer({ db: {} });

      const results = await gs.processMethods(methods);
      expect(results[0]).toStrictEqual({
        id: 'a', error: { message: "No such method 'a'" }
      });
    });

    it('catches and passes error from method func', async () => {
      const methods = [ { name: 'a', id: 'a' } ];
      const gs = new GongoServer({ db: {} });
      gs.methods.a = async function() { throw new Error("error") };

      const result = (await gs.processMethods(methods))[0];
      expect(result.result).not.toBeDefined();
      expect(result.error).toBeType('object');
      expect(result.error.name).toBe('Error');
      expect(result.error.message).toBe('error');
    });

  });

  describe('express', () => {

    it('given (req, res) calls res.write/end with ARSON', async () => {
      const gs = new GongoServer({ db: {} });
      const req = { body: { auth: 'a' }};
      const res = { write: jest.fn(), end: jest.fn() };

      const express = gs.express();
      await express(req, res);

      const empty = ARSON.encode({});
      expect(res.write).toHaveBeenCalledWith(empty);
      expect(res.end).toHaveBeenCalled();
    });

    it('calls process{ChangeSet,Methods,Subs} correctly', async () => {
      const db = { processChangeSet: jest.fn() };
      const gs = new GongoServer({ db });
      gs.processMethods = jest.fn();
      gs.processSubs = jest.fn().mockReturnValue([]);

      const req = { body: { auth: 'a', changeSet: 'cs', methods: 'm', subscriptions: 's' }};
      const res = { write: jest.fn(), end: jest.fn() };
      const auth = new Auth(gs, req.body.auth);

      const express = gs.express();
      await express(req, res);

      expect(db.processChangeSet).toHaveBeenCalledWith('cs', auth, req);
      expect(gs.processMethods).toHaveBeenCalledWith('m', auth, req);
      expect(gs.processSubs).toHaveBeenCalledWith('s', auth, req);
    });

    it('only returns non-empty processSubs result', async () => {
      const gs = new GongoServer({ db: {} });
      const req = { body: { auth: 'a', subscriptions: 's' }};
      const res = { write: jest.fn(), end: jest.fn() };

      const express = gs.express();
      gs.processSubs = jest.fn();

      gs.processSubs.mockReturnValueOnce([]);
      await express(req, res);
      expect(ARSON.decode(res.write.mock.calls[0][0])).toEqual({});

      gs.processSubs.mockReturnValueOnce(['a']);
      await express(req, res);
      expect(ARSON.decode(res.write.mock.calls[1][0])).toEqual({ subResults: [ 'a' ]});
    });

  });

  // should be moved.  note jest.mock('bcrypt') with imports.
  describe('bcrypt', () => {

    it('bcryptHash', async () => {
      const gs = new GongoServer({ db: {} });
      bcrypt.hash.mockReturnValueOnce('hash');
      const result = await gs.bcryptHash('plaintext', 1);
      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 1);
      expect(result).toBe('hash');
    });

    it('bcyptCompare', async () => {
      const gs = new GongoServer({ db: {} });
      bcrypt.compare.mockReturnValueOnce('compare');
      const result = await gs.bcryptCompare('plaintext', 'hash');
      expect(bcrypt.compare).toHaveBeenCalledWith('plaintext', 'hash');
      expect(result).toBe('compare');
    });

  });

});
