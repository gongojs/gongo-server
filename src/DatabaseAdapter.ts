import type { PublicationProps, PublicationResult } from "./publications";
import type { MethodProps } from "./serverless";
import type GongoServerless from "./serverless";
import type { Operation } from "fast-json-patch/module/core.js";
export type { Operation } from "fast-json-patch/module/core.js";
import type { Profile } from "passport";
export type { Profile } from "passport";

export interface DbaUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any; // subclass will override this
  emails: Array<DbaUserEmail>;
  services: Array<DbaUserService>;
  displayName?: string;
}

export interface DbaUserEmail {
  value: string;
  type?: string | undefined;
  verified?: boolean | Date | null;
  primary?: boolean;
  public?: "public" | null;
}

export interface DbaUserService {
  service: string;
  id: string;
  profile: Profile;
  accessToken: string;
  refreshToken: string;
}

export interface DbaUsers {
  createUser(callback: (dbaUser: Partial<DbaUser>) => void): Promise<DbaUser>;
  findOrCreateService(
    email: string | Array<DbaUserEmail> | undefined,
    service: string,
    id: string,
    profile: Profile,
    accessToken: string,
    refreshToken: string
  ): Promise<DbaUser>;
  setSessionData(sid: string, data: Record<string, unknown>): Promise<void>;
  getSessionData(sid: string): Promise<Record<string, unknown> | null>;
  getUserWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<DbaUser | null>;
}

export interface ChangeSetUpdate {
  _id: string;
  patch: Operation[];
}

export interface ChangeSetOps {
  insert?: Array<unknown>;
  update?: Array<ChangeSetUpdate>;
  delete?: Array<string>;
}

export type ChangeSet = Record<string, ChangeSetOps>;

export type ChangeSetError = [
  collection: string,
  id: string,
  error: Record<string, unknown>
];

export interface ChangeSetCollectionOpResult {
  success: string[];
  failure: Array<[_id: string, error: Record<string, unknown>]>;
}

export interface ChangeSetCollectionResult {
  insert?: ChangeSetCollectionOpResult;
  update?: ChangeSetCollectionOpResult;
  delete?: ChangeSetCollectionOpResult;
}

export interface ChangeSetResults {
  [key: string]: ChangeSetCollectionResult;
}

export type OpError = [id: string, error: unknown];

export default interface DatabaseAdapter<DBA extends DatabaseAdapter<DBA>> {
  gs?: GongoServerless<DBA>;
  onInit(gs: GongoServerless<DBA>): void;
  Users: DbaUsers;

  publishHelper(
    // eslint-disable-next-line
    results: any,
    props: PublicationProps<DBA>
  ): Promise<PublicationResult>;

  /*
  processChangeSet(
    changeSet: ChangeSet,
    props: MethodProps<DBA>
  ): Promise<ChangeSetResults>;
  */

  insert(
    collName: string,
    docs: Array<Record<string, unknown>>,
    props: MethodProps<DBA>
  ): Promise<Array<OpError>>;
  update(
    collName: string,
    updates: Array<ChangeSetUpdate>,
    props: MethodProps<DBA>
  ): Promise<Array<OpError>>;
  remove(
    collName: string,
    ids: Array<string>,
    props: MethodProps<DBA>
  ): Promise<Array<OpError>>;

  allowFilter(
    collName: string,
    operationName: "insert",
    docs: Array<Record<string, unknown>>,
    props: MethodProps<DBA>,
    errors: Array<OpError>
  ): Promise<Array<Record<string, unknown>>>;
  allowFilter(
    collName: string,
    operationName: "update",
    docs: Array<ChangeSetUpdate>,
    props: MethodProps<DBA>,
    errors: Array<OpError>
  ): Promise<Array<ChangeSetUpdate>>;
  allowFilter(
    collName: string,
    operationName: "remove",
    docs: Array<string>,
    props: MethodProps<DBA>,
    errors: Array<OpError>
  ): Promise<Array<string>>;
  allowFilter(
    collName: string,
    operationName: "insert" | "update" | "remove",
    docs:
      | Array<Record<string, unknown>>
      | Array<ChangeSetUpdate>
      | Array<string>,
    props: MethodProps<DBA>,
    errors: Array<OpError>
  ): Promise<
    Array<Record<string, unknown>> | Array<ChangeSetUpdate> | Array<string>
  >;
}
