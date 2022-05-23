import type Auth from "./auth-class";
import type DataBaseAdapter from "./DataBaseAdapter";
import type { Request, RequestHandler } from "express";
import { publications, publish, subscribeMethod } from "./publications";
import { GSExpressPost } from "./express";

export interface MethodProps {
  gs: GongoServerless;
  auth: Auth;
  req: Request;
  dba: DataBaseAdapter;
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
  dba?: DataBaseAdapter;
  _publications: typeof publications;
  publish: typeof publish;

  constructor() {
    this.methods = new Map();
    this._publications = publications;
    this.publish = publish;
    this.method("subscribe", subscribeMethod);
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
    }
    out.time = Date.now() - start;

    return out;
  }

  expressPost(): RequestHandler {
    return GSExpressPost.bind(this);
  }
}
