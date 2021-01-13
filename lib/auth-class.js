class Auth {

  constructor(db, untrusted) {
    this.db = db;
    this.untrusted = untrusted;
  }

  async sid() {
    // TODO. optionally check IP or other stuff
    return this.untrusted.sid
  }

  async getSessionData() {
    const sid = await this.sid();
    if (!sid) return {};

    return await this.db.db.Users.getSessionData(sid);
  }

  async setSessionData(data) {
    const sid = await this.sid();
    if (!sid) return null;

    return await this.db.db.Users.setSessionData(sid, data);
  }

  async userId() {
    const data = await this.getSessionData();
    return data.userId;
  }

}

module.exports = { __esModule: true, default: Auth };
