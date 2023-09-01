import type Auth from "./auth-class";
import type DatabaseAdapter from "./DatabaseAdapter";
import type { Request, RequestHandler } from "express";
import { publish, subscribeMethod } from "./publications";
import type { Publications } from "./publications";
import { GSExpressPost } from "./express";
import { GSVercelEdgePost} from "./vercelEdge";
import builtinMethods from "./builtinMethods";
import { insert, update, remove } from "./crud";
//import ARSON from "arson";
const ARSON = require("arson");

export interface MethodProps<DBA extends DatabaseAdapter<DBA>> {
  gs: GongoServerless<DBA>;
  auth: Auth<DBA, Awaited<ReturnType<DBA["Users"]["createUser"]>>>;
  req: Request;
  dba: DBA;
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
export type MethodFunction<DBA extends DatabaseAdapter<DBA>> = (
  db: DBA,
  query: any,
  props: MethodProps<DBA>
) => unknown;

export default class GongoServerless<DBA extends DatabaseAdapter<DBA>> {
  methods: Map<string, MethodFunction<DBA>>;
  dba: DBA;
  _publications: Publications<DBA> = new Map();
  publish = (publish<DBA>).bind(this);
  ARSON = ARSON;
  _supressConsoleErrors = false;

  constructor({ dba }: { dba: DBA }) {
    this.dba = dba;
    this.methods = new Map(Object.entries(builtinMethods));
    this.method("subscribe", (subscribeMethod<DBA>).bind(this));
    /*
    this.method("changeSet", async (db, query, props) => {
      // TODO, v2 dba
      console.log(query);
      return dba && dba.processChangeSet(query, props);
    });
    */
    this.method("insert", insert);
    this.method("update", update);
    this.method("remove", remove);
    
    if (dba && dba.onInit) dba.onInit(this);
  }

  method(name: string, func: MethodFunction<DBA>) {
    if (this.methods.has(name))
      throw new Error(`Method "${name}" already exists`);

    this.methods.set(name, func);
  }

  async _methodExec(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    props: MethodProps<DBA>
  ): Promise<MethodResult> {
    // console.log("_methodExec", "name", name, "query", query, "props", props);
    const method = this.methods.get(name);

    if (!method) {
      return {
        $error: {
          name: "NonExistantMethodError",
          message: `Method "${name}" does not exist`,
        },
        time: 0,
      }
    }

    let out: MethodResult;
    const start = Date.now();

    try {
      out = {
        $result: await method(props.dba, query, props),
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
    return (GSExpressPost<DBA>).bind(this);
  }

  vercelEdgePost() {
    return (GSVercelEdgePost<DBA>).bind(this);
  }
}
