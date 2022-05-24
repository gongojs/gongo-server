import type { MethodProps } from "./serverless";
import type DataBaseAdapter from "./DataBaseAdapter";

export interface CollectionResults {
  coll: string;
  entries: Array<Record<string, unknown>>;
}

export interface PublicationResults {
  results?: Array<CollectionResults>;
}

export type UpdatedAt = Record<string, number>;

export type PublicationFunction = (
  db: DataBaseAdapter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  props: MethodProps
) => Promise<PublicationResults>;

export const publications: Map<string, PublicationFunction> = new Map();

export function publish(name: string, func: PublicationFunction): void {
  if (publications.has(name))
    throw new Error(`Publication "${name}" already exists`);

  publications.set(name, func);
}

export async function subscribeMethod(
  {
    name,
    updatedAt,
    opts,
  }: { name: string; updatedAt: UpdatedAt; opts: Record<string, unknown> },
  props: MethodProps
) {
  const publication = publications.get(name);
  if (!publication) throw new Error("No such publication: " + name);

  let results = await publication(props.dba, opts, props);

  // new: not yet implemeted
  //results = await props.dba.publishHelper(results);
  results = await props.dba.publishHelper(
    results,
    updatedAt,
    props.auth,
    props.req
  );

  return results;
}
