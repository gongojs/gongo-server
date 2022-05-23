import type { Request, RequestHandler, Response } from "express";
import type GongoServerless from "./serverless";
import type { MethodProps, MethodResult } from "./serverless";
import Auth from "./auth-class";

export async function GSExpressPost(
  this: GongoServerless,
  req: Request,
  res: Response
): Promise<void> {
  const $gongo = req.body.$gongo;

  if (!$gongo) {
    res.sendStatus(400);
    res.end();
    return;
  }

  if ($gongo !== 2) {
    res.json({
      $error: {
        message: `Unsupported API version.  Requested: ${$gongo}, Available: 2`,
      },
    });
    res.end();
    return;
  }

  const props: MethodProps = {
    gs: this,
    req: req,
    // @ts-expect-error: think more how to handle this TODO
    dba: this.dba,
    // @ts-expect-error: think more how to handle this TODO
    auth: new Auth(this.dba, req.body.auth),
  };

  const out = {
    calls: [] as Array<MethodResult>,
  };

  if (req.body.calls)
    out.calls = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.body.calls.map(([name, query]: [string, any]) =>
        this._methodExec(name, query, props)
      )
    );

  // console.log(req.body);
  // console.log(out);

  res.json(out);
  res.end();
}
