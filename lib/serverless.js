const ARSON = require('arson');
const bcrypt = require('bcrypt');  // TODO, move somewhere else?

const Auth = require('./auth-class').default;
const builtinMethods = require('./builtinMethods');

class GongoServerless {

  constructor({ db, auth }) {
    this.db = db;
    this.db2 = 2;
    this.ARSON = ARSON;
    db.gongoServer = this;

    if (db.onInit)
      db.onInit(this);

    if (auth) {
      this.auth = auth;
      auth.gongoServer = this;
    }

    this.publications = {};

    // TODO version them?
    this.methods = Object.create(builtinMethods);
  }

  bind(func, ...args) {
    return func.bind(this, ...args);
  }

  publish(name, func) {
    this.publications[name] = func;
  }

  method(name, func) {
    if (this.methods[name])
      throw new Error(`Method "${name}" already exists`);

    this.methods[name] = func;
  }

  async publishExec(name, opts, updatedAt, auth, req) {
    if (!this.publications[name])
      throw new Error('No such publication: ' + name);

    let results = await this.publications[name](this.db, opts, updatedAt, auth, req);
    results = await this.db.publishHelper(results, updatedAt, auth, req);
    console.log(name, results);
    return results;
  }

  async processSubs(subs, auth, req) {
    const subResults = [];
    for (let { name, opts, updatedAt } of subs) {
      try {
        const results = await this.publishExec(name, opts, updatedAt, auth, req);

        if (results.length)
          subResults.push({ name, opts, results });
      } catch (e) {
        const error = { message: e.message };
        console.error(error);
        subResults.push({ name, opts, error });
      }
    }
    return subResults;
  }

  async processMethods(methods, auth, req) {
    const methodsResults = new Array(methods.length);
    let i=0;

    for (let { name, opts, id } of methods) {
      const obj = methodsResults[i++] = { id };

      if (!this.methods[name]) {
        obj.error = { message: "No such method '" + name + "'" }
        continue;
      }

      try {
        obj.result = await this.methods[name](this.db, opts, auth, req);
      } catch (e) {
        let { stack, message, name } = e;
        obj.error = { stack, message, name };
      }

    }
    return methodsResults;
  }


  // ---
  async bcryptHash(plaintext, saltRounds = 10) {
    return await bcrypt.hash(plaintext, saltRounds);
  }
  async bcryptCompare(plaintext, hash) {
    return await bcrypt.compare(plaintext, hash);
  }
  // ---

  express() {
    return async (req, res) => {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('X-Gongo-Response-API', '1');

      const out = {};
      const body = ARSON.decode(req.body);

      console.log('decoded body', JSON.stringify(body, null, 2));

      const auth = new Auth(this, body.auth);

      const apiVersion = req.headers['x-gongo-request-api'] && parseInt(req.headers['x-gongo-request-api']);
      if (!apiVersion || apiVersion !== 1) {
        res.write(ARSON.encode({
          error: {
            message: `API version mismatch, expected 1 received '${apiVersion}'`
          }
        }));
        res.end();
      }

      if (body.changeSet)
        out.csResults = await this.db.processChangeSet(body.changeSet, auth, req);

      if (body.methods)
        out.methodsResults = await this.processMethods(body.methods, auth, req);

      if (body.subscriptions) {
        const subResults = await this.processSubs(body.subscriptions, auth, req);
        if (subResults.length)
          out.subResults = subResults;
      }

      console.log(out);
      res.write(ARSON.encode(out));
      res.end();
    }
  }

}

module.exports = { __esModule: true, default: GongoServerless };
