import type { PublicationResults, UpdatedAt } from "./publications";
import type Auth from "./auth-class";
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

export default interface DataBaseAdapter {
  onInit(gs: GongoServerless): void;
  Users: DbaUsers;

  publishHelper(
    results: unknown,
    updatedAt?: UpdatedAt,
    auth?: Auth, // replace with methodProps after modding dba
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req?: any // replace with methodProps after updating dba
  ): Promise<PublicationResults>;

  processChangeSet(
    query: Record<string, unknown>,
    props: MethodProps
  ): Promise<ChangeSetResults>;
}
