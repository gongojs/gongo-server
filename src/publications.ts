import type { MethodProps } from "./serverless";
import type DatabaseAdapter from "./DatabaseAdapter";
import type GongoServerless from "./serverless";

export interface CollectionResults {
  coll: string;
  entries: Array<Record<string, unknown>>;
}

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

export interface PublicationResults {
  results?: Array<CollectionResults>;
  resultsMeta?: ResultMeta;
}

export type UpdatedAt = Record<string, number>;

export interface PublicationProps<DBA extends DatabaseAdapter>
  extends MethodProps<DBA> {
  name: string;
  updatedAt: UpdatedAt;
}

type TypeOfFirstArg<T> = T extends (
  first: infer FirstArg,
  ...args: any[]
) => any
  ? FirstArg
  : never;

export type PublicationFunction<DBA extends DatabaseAdapter> = (
  db: DBA,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  props: MethodProps<DBA>
  //) => Promise<PublicationResults> | any /* cursor */;
) => Promise<PublicationResults> | TypeOfFirstArg<DBA["publishHelper"]>;

export type Publications<DBA extends DatabaseAdapter> = Map<
  string,
  PublicationFunction<DBA>
>;

// export const publications: Publications = new Map();
//export const publications: Map<string, PublicationFunction> = new Map();

export function publish<DBA extends DatabaseAdapter>(
  this: GongoServerless<DBA>,
  name: string,
  func: PublicationFunction<DBA>
): void {
  if (this._publications.has(name))
    throw new Error(`Publication "${name}" already exists`);

  this._publications.set(name, func);
}

// gs.method("subscribe", subscribeMethod);
export async function subscribeMethod<DBA extends DatabaseAdapter>(
  this: GongoServerless<DBA>,
  db: DBA,
  {
    name,
    updatedAt,
    opts,
  }: { name: string; updatedAt: UpdatedAt; opts: Record<string, unknown> },
  props: MethodProps<DBA>
) {
  const publication = this._publications.get(name);
  if (!publication) throw new Error("No such publication: " + name);

  const publicationProps: PublicationProps<DBA> = { ...props, name, updatedAt };

  let results = await publication(props.dba, opts, publicationProps);

  results = await props.dba.publishHelper(results, publicationProps);
  /*
  results = await props.dba.publishHelper(
    results,
    updatedAt,
    props.auth,
    props.req
  );
  */

  return results;
}
