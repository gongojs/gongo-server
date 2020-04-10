const builtinMethods = require('./builtinMethods');

class GongoServerless {

  constructor({ db }) {
    this.db = db;
    this.publications = {};

    // TODO version them?
    this.methods = Object.create(builtinMethods);
  }

  publish(name, func) {
    this.publications[name] = func;
  }

  async publishExec(name, opts, updatedAt) {
    let results = await this.publications[name](this.db, opts, updatedAt);
    results = await this.db.publishHelper(results, updatedAt);
    console.log(name, results);
    return results;
  }

  async processSubs(subs) {
    const subResults = [];
    for (let { name, opts, updatedAt } of subs) {
      const results = await this.publishExec(name, opts, updatedAt);

      if (results.length)
        subResults.push({ name, opts, results });
    }
    return subResults;
  }

  async processMethods(methods) {
    const methodsResults = new Array(methods.length);
    let i=0;

    for (let { name, opts, id } of methods) {
      const obj = methodsResults[i++] = { id };

      if (!this.methods[name]) {
        obj.error = { message: 'No such method "' + name + '""' }
        continue;
      }

      try {
        obj.result = this.methods[name](this, opts);
      } catch (e) {
        let { stack, message, name } = e;
        obj.error = { stack, message, name };
      }

    }
    return methodsResults;
  }

  express() {
    return async (req, res) => {
      const out = {};
      console.log('req.body');
      console.log(JSON.stringify(req.body, null, 2));

      if (req.body.changeSet)
        out.csResults = await this.db.processChangeSet(req.body.changeSet);

      if (req.body.methods)
        out.methodsResults = await this.processMethods(req.body.methods);

      if (req.body.subscriptions) {
        const subResults = await this.processSubs(req.body.subscriptions);
        if (subResults.length)
          out.subResults = subResults;
      }

      res.json(out);
    }
  }

}

module.exports = { __esModule: true, default: GongoServerless };
