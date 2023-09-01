import type { Request, Response } from "express";
import type GongoServerless from "./serverless";
import type { MethodProps, MethodResult } from "./serverless";
import type DatabaseAdapter from "./DatabaseAdapter";
import Auth from "./auth-class";

export async function GSExpressPost<DBA extends DatabaseAdapter<DBA>>(
  this: GongoServerless<DBA>,
  req: Request,
  res: Response
): Promise<void> {
  //console.log(JSON.stringify(req.body, null, 2));
  //const $gongo = req.body.$gongo;
  let query;
  try {
    query = this.ARSON.decode(req.body);
  } catch (error) {
    if (!this._supressConsoleErrors) {
      console.error("Error decoding: " + JSON.stringify(req.body));
      console.error(error);
    }
    res.status(400).send("Bad Request");
    res.end();
    return;
  }
  //console.log(query);

  if (!query.$gongo) {
    //res.sendStatus(400); // not available in vercel
    res.status(400).send("Bad Request");
    res.end();
    return;
  }

  if (query.$gongo !== 2) {
    // res.status(400);
    res.send(
      this.ARSON.encode({
        $error: {
          message: `Unsupported API version.  Requested: ${query.$gongo}, Available: 2`,
        },
      })
    );
    res.end();
    return;
  }

  const cookie = req.headers.cookie;
  const nextAuthSessionToken = (function () {
    // next-auth.session-token=45df020e-1424-4d13-8bd5-5bd59851c774
    const match = cookie && cookie.match(/\bnext-auth\.session-token=([^;]+)/);
    return match && match[1];
  })();

  const props: MethodProps<DBA> = {
    gs: this,
    req: req,
    dba: this.dba,
    auth: new Auth(this.dba, { nextAuthSessionToken, ...query.auth }),
  };

  const calls = query.calls as [string, unknown][] | undefined;

  const out = {
    calls: new Array<MethodResult>((calls && calls.length) ?? 0),
  };

  if (calls && calls.length) {
    const promises = new Array<Promise<MethodResult>>(calls.length);

    // Run non-subs first (i.e. so updates take place before subs)
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (call[0] !== "subscribe")
        promises[i] = this._methodExec(call[0], call[1], props);
    }
    await Promise.all(promises);

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (call[0] === "subscribe")
        promises[i] = this._methodExec(call[0], call[1], props);
    }

    out.calls = await Promise.all(promises);

    /*
    out.calls = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.calls.map(([name, query]: [string, any]) =>
        this._methodExec(name, query, props)
      )
    );
    */
  }

  // console.log(req.body);
  // console.log(out);
  //res.json(out);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(this.ARSON.encode(out));
  res.end();
}
