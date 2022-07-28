import type { MethodFunction, MethodProps } from "./serverless";
import type DatabaseAdapter from "./DatabaseAdapter";
import type { OpError, ChangeSetUpdate } from "./DatabaseAdapter";

export async function insert<DBA extends DatabaseAdapter<DBA>>(
  db: DBA,
  { coll, docs }: { coll: string; docs: Array<Record<string, unknown>> },
  props: MethodProps<DBA>
): Promise<unknown> {
  let errors: Array<OpError> = [];

  // check allow() callbacks
  const allowedDocs = docs;

  errors = errors.concat(await db.insert(coll, allowedDocs, props));

  return errors.length ? { $errors: errors } : {};
}

export async function update<DBA extends DatabaseAdapter<DBA>>(
  db: DBA,
  { coll, updates }: { coll: string; updates: Array<ChangeSetUpdate> },
  props: MethodProps<DBA>
): Promise<unknown> {
  let errors: Array<OpError> = [];

  // check allow() callbacks
  //const allowedDocs = docs;

  errors = errors.concat(await db.update(coll, updates, props));

  return errors.length ? { $errors: errors } : {};
}

export async function remove<DBA extends DatabaseAdapter<DBA>>(
  db: DBA,
  { coll, ids }: { coll: string; ids: Array<string> },
  props: MethodProps<DBA>
): Promise<unknown> {
  let errors: Array<OpError> = [];

  // check allow() callbacks
  //const allowedDocs = docs;

  errors = errors.concat(await db.remove(coll, ids, props));

  return errors.length ? { $errors: errors } : {};
}
