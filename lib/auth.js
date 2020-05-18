class GongoAuth {

  constructor() {
    this.gongoPassport = this.gongoPassport.bind(this);
  }

  gongoPassport(req, accessToken, refreshToken, profile, cb) {
    const state = JSON.parse(req.query.state);
    console.log(this);
    console.log(state);
    console.log(5, {accessToken, refreshToken, profile, cb});

  //    User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //  return cb(err, user);
    //});
  }

}

module.exports = { __esModule: true, default: GongoAuth };
