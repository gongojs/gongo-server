const builtinMethods = require('./builtinMethods');

// TODO, move somewhere else?
const bcrypt = require('bcrypt');

class GongoServerless {

  constructor({ db, auth }) {
    this.db = db;
    db.gongoServer = this;

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

  async publishExec(name, opts, updatedAt, auth, req) {
    let results = await this.publications[name](this.db, opts, updatedAt, auth, req);
    results = await this.db.publishHelper(results, updatedAt, auth, req);
    console.log(name, results);
    return results;
  }

  async processSubs(subs, auth, req) {
    const subResults = [];
    for (let { name, opts, updatedAt } of subs) {
      const results = await this.publishExec(name, opts, updatedAt, auth, req);

      if (results.length)
        subResults.push({ name, opts, results });
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
        obj.result = await this.methods[name](this, opts, auth, req);
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
      const out = {};
      console.log('req.body');
      console.log(JSON.stringify(req.body, null, 2));

      const auth = req.body.auth;

      if (req.body.changeSet)
        out.csResults = await this.db.processChangeSet(req.body.changeSet, auth, req);

      if (req.body.methods)
        out.methodsResults = await this.processMethods(req.body.methods, auth, req);

      if (req.body.subscriptions) {
        const subResults = await this.processSubs(req.body.subscriptions, auth, req);
        if (subResults.length)
          out.subResults = subResults;
      }

      res.json(out);
    }
  }

}

module.exports = { __esModule: true, default: GongoServerless };
