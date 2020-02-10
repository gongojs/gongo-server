class GongoServerless {

  constructor({ db }) {
    this.db = db;
    this.publications = {};
  }

  publish(name, func) {
    this.publications[name] = func;
  }

  async publishExec(name, opts) {
    let results = await this.publications[name](this.db, opts);
    results = await this.db.publishHelper(results);
    console.log(name, results);
    return results;
  }

  async processSubs(subs) {
    const subResults = [];
    for (let [name, opts] of subs) {
      const results = await this.publishExec(name, opts);

      if (results.length)
        subResults.push({ name, opts, results });
    }
    return subResults;
  }

  express() {
    return async (req, res) => {
      const out = {};

      if (req.body.changeSet)
        out.csResults = await this.db.processChangeSet(req.body.changeSet);

      if (req.body.subscriptions)
        out.subs = await this.processSubs(req.body.subscriptions);

      res.json(out);
    }
  }

}

module.exports = { __esModule: true, default: GongoServerless };
