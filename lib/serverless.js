class GongoServerless {

  constructor({ db }) {
    this.db = db;
    this.publications = {};
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

  express() {
    return async (req, res) => {
      const out = {};
      console.log('req.body');
      console.log(JSON.stringify(req.body, null, 2));

      if (req.body.changeSet)
        out.csResults = await this.db.processChangeSet(req.body.changeSet);

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
