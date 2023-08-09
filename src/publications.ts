import type { MethodProps } from "./serverless";
import type DatabaseAdapter from "./DatabaseAdapter";
import type GongoServerless from "./serverless";

export interface CollectionResults {
  coll: string;
  entries: Array<Record<string, unknown>>;
}

export type PublicationResult = CollectionResults[];

export interface UpdateRange {
  coll: string;
  from: number;
  to: number;
}

export interface ResultMeta {
  size: number;
  updateRanges: Array<UpdateRange>;
  url: string;
}

export interface PublicationResponse {
  results?: PublicationResult;
  resultsMeta?: ResultMeta;
}

export type UpdatedAt = Record<string, number>;

export interface PublicationProps<DBA extends DatabaseAdapter<DBA>>
  extends MethodProps<DBA> {
  name: string;
  updatedAt: UpdatedAt;
  sort?: [string, "asc" | "desc"];
  limit?: number;
  lastSortedValue?: unknown;
}

type TypeOfFirstArg<T> = T extends (
  first: infer FirstArg,
  ...args: any[]
) => any
  ? FirstArg
  : never;

export type PublicationFunction<DBA extends DatabaseAdapter<DBA>> = (
  db: DBA,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  props: PublicationProps<DBA>
  //) => Promise<PublicationResults> | any /* cursor */;
) =>
  | Promise<PublicationResult>
  | TypeOfFirstArg<DBA["publishHelper"]>
  | Promise<TypeOfFirstArg<DBA["publishHelper"]>>;

export type Publications<DBA extends DatabaseAdapter<DBA>> = Map<
  string,
  PublicationFunction<DBA>
>;

// export const publications: Publications = new Map();
//export const publications: Map<string, PublicationFunction> = new Map();

export function publish<DBA extends DatabaseAdapter<DBA>>(
  this: { [key: string]: any; _publications: Publications<DBA> },
  name: string,
  func: PublicationFunction<DBA>
): void {
  if (this._publications.has(name))
    throw new Error(`Publication "${name}" already exists`);

  this._publications.set(name, func);
}

// gs.method("subscribe", subscribeMethod);
export async function subscribeMethod<DBA extends DatabaseAdapter<DBA>>(
  this: GongoServerless<DBA>,
  db: DBA,
  {
    name,
    updatedAt,
    args,
    opts,
    lastSortedValue,
  }: {
    name: string;
    updatedAt: UpdatedAt;
    args: Record<string, unknown>;
    opts?: Record<string, unknown>;
    lastSortedValue?: unknown;
  },
  props: MethodProps<DBA>
): Promise<PublicationResponse> {
  const publication = this._publications.get(name);
  if (!publication) throw new Error("No such publication: " + name);

  const publicationProps: PublicationProps<DBA> = {
    ...props,
    name,
    updatedAt,
    lastSortedValue,
  };

  if (opts) {
    if (opts.sort)
      publicationProps.sort = opts.sort as [string, "asc" | "desc"];
    if (opts.limit) publicationProps.limit = opts.limit as number;
  }

  let results = await publication(props.dba, args, publicationProps);

  results = await props.dba.publishHelper(results, publicationProps);
  /*
  results = await props.dba.publishHelper(
    results,
    updatedAt,
    props.auth,
    props.req
  );
  */

  return {
    results,
    // resultsMeta
  };
}
