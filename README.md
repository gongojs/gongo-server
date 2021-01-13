# gongo-server

*Server(less) components for GongoJS fullstack data and auth*

Copyright (c) 2020 by Gadi Cohen.  MIT licensed.

![npm](https://img.shields.io/npm/v/gongo-server) [![CircleCI](https://img.shields.io/circleci/build/github/gongojs/gongo-server)](https://circleci.com/gh/gongojs/gongo-server) [![coverage](https://img.shields.io/codecov/c/github/gongojs/gongo-server)](https://codecov.io/gh/gongojs/gongo-server) ![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

## QuickStart

Assumes files placed in `api` directory are serverless functions (aka lambdas
or cloud functions), like with Vercel, or `pages/api` in Next.JS.

`api/gongoPoll.js`:

```js
const GongoServer = require('gongo-server/lib/serverless').default;
const Database = require('gongo-server-db-mongo').default;

const gs = new GongoServer({
  db: new Database('mongodb://localhost')
});

gs.db.Users.ensureAdmin('email@address', 'initialPassword');

gs.publish('test', db => db.collection('test').find());

module.exports = gs.express();
```

`api/gongoAuth.js` (optional):

```js
const GongoServer = require('gongo-server/lib/serverless').default;
const GongoAuth = require('gongo-server/lib/auth').default;
const Database = require('gongo-server-db-mongo').default;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const gs = new GongoServer({
  db: new Database('mongodb://localhost')
});

const gongoAuth = new GongoAuth(gs, passport);

gongoAuth.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3001/api/gongoAuth",
  passReqToCallback: true,
}, gongoAuth.passportVerify), {
  scope: 'email+profile'
});

module.exports = (req, res, next) => {
  passport.authenticate('google', gongoAuth.boundPassportComplete(req, res))(req, res, next);
}
```

## Environment variables

* `NO_ENSURE=1`

  By default, gongo will "ensure" some things in the database, like the admin
  user, oauth2 settings, etc.  This happens every time the server is launched.
  For busy sites, setting this option to true will skip these checks, which
  will slightly reduce load on your database server every time a lambda cold
  starts.
