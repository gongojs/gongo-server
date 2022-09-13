//const { debounce } = require("./utils");
import type { Request, Response } from "express";
import type { Authenticator, Profile, Strategy } from "passport";
import type OAuth2Strategy from "passport-oauth2";
import type { VerifyCallback } from "passport-oauth2";

import type DatabaseAdapter from "./DatabaseAdapter.js";
import type { DbaUser } from "./DatabaseAdapter.js";
import type GongoServerless from "./serverless.js";

export interface StrategyData {
  _id: string;
  name: string;
  type: string;
  __updatedAt?: number;
}

export interface OAuth2StrategyData extends StrategyData {
  type: "oauth2";
  oauth2: {
    authorize_url: string;
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
  };
}

export default class GongoAuth<DBA extends DatabaseAdapter<DBA>> {
  gongoServer: GongoServerless<DBA>;
  passport: Authenticator;
  dba?: DBA;
  strategyData: Array<StrategyData | OAuth2StrategyData>;

  constructor(gongoServer: GongoServerless<DBA>, passport: Authenticator) {
    this.gongoServer = gongoServer;
    this.passport = passport;
    this.dba = gongoServer.dba;

    this.strategyData = [];

    this.passportVerify = this.passportVerify.bind(this);
    // this.ensureDbStrategyData = debounce(this.ensureDbStrategyData, 50);
  }

  async ensureDbStrategyData() {
    if (process.env.NO_ENSURE) return;

    // @ts-expect-error: injected
    const accounts = this.dba.collection("accounts");
    const existings: Array<StrategyData> = await accounts.find().toArray();

    await Promise.all(
      this.strategyData.map(async (strategy) => {
        const existing = existings.find((s) => s._id === strategy._id);
        if (existing) {
          strategy.__updatedAt = existing.__updatedAt; // for comparison
          if (JSON.stringify(existing) !== JSON.stringify(strategy)) {
            console.log("Updated db.accounts for " + existing.name);
            await accounts.replaceOne({ _id: existing._id }, strategy);
          }
        } else {
          await accounts.insertOne(strategy);
        }
      })
    );

    this.ensureDbStrategyData = () => Promise.resolve();
  }

  // TODO, rename to passportOauth2Verify or check for OAuth2 class...
  passportVerify(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    cb: VerifyCallback
  ) {
    if (typeof req.query.state !== "string")
      throw new Error("passportVerify(), typeof req.query.state !== 'string'");

    const state = JSON.parse(req.query.state);
    // console.log(this); // gongoAuth (has gongoAuth.gongoServer)
    // console.log(state); // { sessionId, service: 'google' };
    // 'google' also in profile.provider
    // console.log(profile);

    if (!this.dba) throw new Error("passportVerify(), this.dba not defined");

    this.dba.Users.findOrCreateService(
      profile.emails,
      profile.provider,
      profile.id,
      profile,
      accessToken,
      refreshToken
    )
      .then((user) => {
        let ip;
        if (req.headers["x-forwarded-for"]) {
          if (typeof req.headers["x-forwarded-for"] === "string")
            ip = req.headers["x-forwarded-for"].split(",")[0].trim();
          else ip = req.headers["x-forwarded-for"][0];
        } else {
          ip = (req.socket || req.connection).remoteAddress;
        }

        const data = {
          userId: user._id,
          userAgent: req.headers["user-agent"],
          ip,
        };
        if (!this.dba)
          throw new Error("passportVerify(), this.dba not defined");
        this.dba.Users.setSessionData(state.sessionId, data);

        cb(null, user);
      })
      .catch((err) => cb(err));

    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //  return cb(err, user);
    //});
  }

  boundPassportComplete(req: Request, res: Response) {
    return this.passportComplete.bind(this, req, res);
  }

  passportComplete(
    req: Request,
    res: Response,
    err: unknown,
    user: DbaUser,
    info: unknown
  ) {
    console.log(
      'WARNING, DEVEL TARGET_ORIGIN SET TO "*" IN GONGO-SERVER/AUTH.JS'
    );
    console.log("complete");
    console.log({ err, user, info });
    //res.sendStatus(200);
    //
    const data = { userId: user._id };
    // could also send jwt?

    res.end(
      "<html><head><script>" +
        "window.opener.postMessage(" +
        JSON.stringify(data) +
        ', "*");' +
        "window.close();" +
        "</script></head></html>"
    );
  }

  use(strategy: Strategy | OAuth2Strategy, extra = {}) {
    if ("_oauth2" in strategy) {
      console.log("Found oauth2 strategy " + strategy.name);

      // @ts-expect-error: uhhh...
      if (!strategy._passReqToCallback)
        throw new Error(
          "oauth2 strategy initiated without passReqToCallback: true"
        );

      // @ts-expect-error: strictly speaking it's protected
      const oauth2 = strategy._oauth2;

      this.strategyData.push({
        // @ts-expect-error: yeah we shouldn't really be using this
        _id: strategy._key as string,
        name: strategy.name as string,
        type: "oauth2",
        oauth2: {
          // @ts-expect-error: strictly speaking it's protected
          authorize_url: oauth2._authorizeUrl,
          // @ts-expect-error: strictly speaking it's protected
          client_id: oauth2._clientId,
          // @ts-expect-error: strictly speaking it's protected
          redirect_uri: strategy._callbackURL,
          response_type: "code",
          // @ts-expect-error: strictly speaking it's protected
          // strategy._scope is new I think TODO, could be array too?  scopeSeparator.
          scope: extra.scope as string,
        },
      });
    } else {
      console.log("Added unknown strategy " + strategy.name);
      console.log("Passed through to passport, but so far only");
      console.log("oauth2 strategies are support.  Please open an issue to");
      console.log("request support for this kind of strategy");
    }

    this.passport.use(strategy);
    //this.ensureDbStrategyData();
  }

  /*
  addPassport(passport) {
    Object.values(passport._strategies).forEach((strategy) => {});
  }
  */
}
