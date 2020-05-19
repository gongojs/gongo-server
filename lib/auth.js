class GongoAuth {

  constructor(gongoServer, passport) {
    this.gongoServer = gongoServer;
    this.passport = passport;
    this.db = gongoServer.db;

    this.passportVerify = this.passportVerify.bind(this);
  }

  passportVerify(req, accessToken, refreshToken, profile, cb) {
    const state = JSON.parse(req.query.state);
    //console.log(this); // gongoAuth (has gongoAuth.gongoServer)
    //console.log(state); { sessionId, service: 'google' };
    //'google' also in profile.provider

    const db = this.gongoServer.db;
    db.Users.findOrCreateService(profile.emails, state.service, profile.id, profile, accessToken, refreshToken).then(user => {
      let ip;
      if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(',')[0].trim();
      } else {
        ip = req.connection.remoteAddress;
      }

      const data = { userId: user._id, userAgent: req.headers['user-agent'], ip };
      db.Users.setSessionData(req.query.state.sessionId, data);

      cb(null, user);
    }).catch(err => cb(err));

    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //  return cb(err, user);
    //});
  }

  boundPassportComplete(req, res) {
    return this.passportComplete.bind(this, req, res);
  }

  passportComplete(req, res, err, user, info) {
    console.log('WARNING, DEVEL TARGET_ORIGIN SET TO "*" IN GONGO-SERVER/AUTH.JS');
    console.log('complete');
    console.log({ err, user, info });
    //res.sendStatus(200);
    res.end(`
<html><head><script>
window.opener.postMessage({ blah: true }, '*');
window.close();
</script></head></html>
`)
  }

  use(strategy) {
    if (strategy._oauth2) {
      console.log('Found oauth2 strategy ' + strategy.name);

      if (!strategy._passReqToCallback)
        throw new Error("oauth2 strategy initiated without passReqToCallback: true");
    }

    this.passport.use(strategy);
  }

  addPassport(passport) {
    Object.values(passport._strategies).forEach(strategy => {
    });
  }

}

module.exports = { __esModule: true, default: GongoAuth };
