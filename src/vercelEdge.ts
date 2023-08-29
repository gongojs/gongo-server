import type GongoServerless from "./serverless";
import type { MethodProps, MethodResult } from "./serverless";
import type DatabaseAdapter from "./DatabaseAdapter";
import Auth from "./auth-class";

export async function GSVercelEdgePost<DBA extends DatabaseAdapter<DBA>>(
  this: GongoServerless<DBA>,
  req: Request
): Promise<Response> {
  //console.log(JSON.stringify(req.body, null, 2));
  //const $gongo = req.body.$gongo;
  let query;
  const body = await req.text();
  try {
    query = this.ARSON.decode(body);
  } catch (error) {
    if (!this._supressConsoleErrors) {
      console.error("Error decoding: " + JSON.stringify(body));
      console.error(error);
    }
    return new Response("Bad Request", { status: 400 });
  }
  //console.log(query);

  if (!query.$gongo) {
    return new Response("Bad Request", { status: 400 });
  }

  if (query.$gongo !== 2) {
    return new Response(
      this.ARSON.encode({
        $error: {
          message: `Unsupported API version.  Requested: ${query.$gongo}, Available: 2`,
        },
      }),
      { status: 400 }
    );
  }

  const props: MethodProps<DBA> = {
    gs: this,
    // @ts-expect-error: later
    req: req,
    // @ts-expect-error: think more how to handle this TODO
    dba: this.dba,
    // @ts-expect-error: think more how to handle this TODO
    auth: new Auth(this.dba, query.auth),
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

  return new Response(this.ARSON.encode(out), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
