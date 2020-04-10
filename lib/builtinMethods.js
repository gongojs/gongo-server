module.exports = {

  echo(db, opts) {
    return opts;
  },

  async loginWithPassword(db, { email, password }) {
    const user = await db.db.Users.getUserWithEmailAndPassword(email, password);
    if (!user) return null;

    let userId = user._id;
    if (typeof userId === 'object')
      userId = userId.toString();

    return { userId };
  }

}
