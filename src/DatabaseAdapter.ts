import type { PublicationProps, PublicationResults } from "./publications";
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

export interface ChangeSetResults {
  $errors?: Array<ChangeSetError>;
}

export default interface DatabaseAdapter {
  gs?: GongoServerless;
  onInit(gs: GongoServerless): void;
  Users: DbaUsers;

  publishHelper(
    // eslint-disable-next-line
    results: any,
    props: PublicationProps
  ): Promise<PublicationResults>;

  processChangeSet(
    changeSet: ChangeSet,
    props: MethodProps
  ): Promise<ChangeSetResults>;
}
