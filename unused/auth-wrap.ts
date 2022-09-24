let auth: Auth<MongoDBA, MongoDbaUser>, session;

if (req.query.auth) {
  return new Promise(async (resolve) => {
    if (!gs.dba) throw new Error("No gs.dba");
    const state = JSON.parse(req.query.state);

    auth = new Auth(gs.dba, { sid: state.sessionId });
    session = (await auth.getSessionData()) || {};

    const fakeReq = {
      // passport sets logIn, logOut, isAuthenticated, isUnauthenticated, _sessionManager
      query: {},
      session,
    };
    const fakeRes = {
      statusCode: 500,
      setHeader(key: string, value: string) {
        res.setHeader(key, value);
      },
      async end() {
        await auth.setSessionData(fakeReq.session);
        res.status(fakeRes.statusCode).end();
        resolve(true);
      },
    };

    const next = (error: unknown) => {
      if (error) {
        let message = "Unknown";
        if (error instanceof Error) message = error.message;
        console.error(error);
        res.status(500).end("passport.authenticate() error: " + message);
      } else {
        res
          .status(400)
          .end("passport.authenticate() No such service: " + req.query.service);
      }
      resolve(true);
    };

    passport.authenticate(req.query.service)(fakeReq, fakeRes, next);
  });
}
