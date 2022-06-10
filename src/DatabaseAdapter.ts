import type { PublicationProps, PublicationResult } from "./publications";
import type { MethodProps } from "./serverless";
import type GongoServerless from "./serverless";
import type { Operation } from "fast-json-patch/module/core.js";
export type { Operation } from "fast-json-patch/module/core.js";
import type { Profile } from "passport";
export type { Profile } from "passport";

interface InstanceWithToStringMethod {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  toString(): string;
}

export interface DbaUser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _id: string | InstanceWithToStringMethod;
  emails: Array<DbaUserEmail>;
  services: Array<DbaUserService>;
  displayName?: string;
}

export interface DbaUserEmail {
  value: string;
  type?: string | undefined;
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
  getSessionData(sid: string): Promise<Record<string, unknown>>;
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

export type OpError = [id: string, error: unknown][];

export default interface DatabaseAdapter<DBA extends DatabaseAdapter<DBA>> {
  gs?: GongoServerless<DBA>;
  onInit(gs: GongoServerless<DBA>): void;
  Users: DbaUsers;

  publishHelper(
    // eslint-disable-next-line
    results: any,
    props: PublicationProps<DBA>
  ): Promise<PublicationResult>;

  processChangeSet(
    changeSet: ChangeSet,
    props: MethodProps<DBA>
  ): Promise<ChangeSetResults>;

  insert(
    collName: string,
    docs: Array<Record<string, unknown>>
  ): Promise<Array<OpError>>;
  update(
    collName: string,
    updates: Array<ChangeSetUpdate>
  ): Promise<Array<OpError>>;
  remove(collName: string, ids: Array<string>): Promise<Array<OpError>>;
}
