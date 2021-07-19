module.exports = {

  echo(db, opts) {
    return opts;
  },

  async loginWithPassword(db, { email, password }, auth, req) {
    const user = await db.Users.getUserWithEmailAndPassword(email, password);
    if (!user) return null;

    let userId = user._id;
    if (typeof userId === 'object')
      userId = userId.toString();

    let ip;
    if (req.headers['x-forwarded-for']) {
      ip = req.headers['x-forwarded-for'].split(',')[0].trim();
    } else {
      ip = req.connection.remoteAddress;
    }

    if (auth && auth.sid) {
      const data = { userId, userAgent: req.headers['user-agent'], ip };
      db.db.Users.setSessionData(auth.sid, data);
    }

    return { userId };
  }

}
