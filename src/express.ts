import type { Request, RequestHandler, Response } from "express";
import type GongoServerless from "./serverless";
import type { MethodProps, MethodResult } from "./serverless";
import Auth from "./auth-class";

export async function GSExpressPost(
  this: GongoServerless,
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

  const props: MethodProps = {
    gs: this,
    req: req,
    // @ts-expect-error: think more how to handle this TODO
    dba: this.dba,
    // @ts-expect-error: think more how to handle this TODO
    auth: new Auth(this.dba, query.auth),
  };

  const out = {
    calls: [] as Array<MethodResult>,
  };

  if (query.calls)
    out.calls = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.calls.map(([name, query]: [string, any]) =>
        this._methodExec(name, query, props)
      )
    );

  // console.log(req.body);
  // console.log(out);
  //res.json(out);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(this.ARSON.encode(out));
  res.end();
}
