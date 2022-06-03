import type Auth from "./auth-class";
import type DatabaseAdapter from "./DatabaseAdapter";
import type { Request, RequestHandler } from "express";
import { publications, publish, subscribeMethod } from "./publications";
import { GSExpressPost } from "./express";
import builtinMethods from "./builtinMethods";
//import ARSON from "arson";
const ARSON = require("arson");

export interface MethodProps {
  gs: GongoServerless;
  auth: Auth;
  req: Request;
  dba: DatabaseAdapter;
}

export interface ErrorObject {
  name?: string;
  message?: string;
  stack?: string;
}

export interface MethodResult {
  $result?: unknown;
  $error?: ErrorObject;
  time?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MethodFunction = (query: any, props: MethodProps) => unknown;

export default class GongoServerless {
  methods: Map<string, MethodFunction>;
  dba?: DatabaseAdapter;
  _publications = publications;
  publish = publish;
  ARSON = ARSON;
  _supressConsoleErrors = false;

  constructor({ dba }: { dba?: DatabaseAdapter } = {}) {
    this.dba = dba;
    this.methods = new Map(Object.entries(builtinMethods));
    this.method("subscribe", subscribeMethod);
    this.method("changeSet", async (query, props) => {
      // TODO, v2 dba
      console.log(query);
      return dba && dba.processChangeSet(query, props);
    });

    if (dba && dba.onInit) dba.onInit(this);
  }

  method(name: string, func: MethodFunction) {
    if (this.methods.has(name))
      throw new Error(`Method "${name}" already exists`);

    this.methods.set(name, func);
  }

  async _methodExec(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    props: MethodProps
  ): Promise<MethodResult> {
    const method = this.methods.get(name);

    if (!method) throw new Error(`Method "${name}" does not exist`);

    let out: MethodResult;
    const start = Date.now();

    try {
      out = {
        $result: await method(query, props),
      };
    } catch (error) {
      if (error instanceof Error) {
        out = {
          $error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        };
      } else {
        out = {
          $error: {
            message: "Unknown error: " + JSON.stringify(error),
          },
        };
      }
      if (!this._supressConsoleErrors) {
        console.error(`Error in ${name}(${JSON.stringify(query)}):`);
        console.error(error);
      }
    }
    out.time = Date.now() - start;

    return out;
  }

  expressPost(): RequestHandler {
    return GSExpressPost.bind(this);
  }
}
