import type { PublicationProps, PublicationResults } from "./publications";
import type { MethodProps } from "./serverless";
import type GongoServerless from "./serverless";

interface InstanceWithToStringMethod {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  toString(): string;
}

export interface DbaUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _id: string | InstanceWithToStringMethod;
}

export interface DbaUsers {
  setSessionData(sid: string, data: Record<string, unknown>): Promise<void>;
  getSessionData(sid: string): Promise<Record<string, unknown>>;
  getUserWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<DbaUser | null>;
}

export type ChangeSetError = [
  collection: string,
  id: string,
  error: Record<string, unknown>
];

export interface ChangeSetResults {
  $errors: Array<ChangeSetError>;
}

export default interface DatabaseAdapter {
  onInit(gs: GongoServerless): void;
  Users: DbaUsers;

  publishHelper(
    results: unknown,
    props: PublicationProps
  ): Promise<PublicationResults>;

  processChangeSet(
    query: Record<string, unknown>,
    props: MethodProps
  ): Promise<ChangeSetResults>;
}
