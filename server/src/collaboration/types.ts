export interface Document {
  id: string;
  type: string;
  snapshot: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Snapshot {
  id: number;
  docId: string;
  version: number;
  data: string;
  createdAt: Date;
}

export interface Operation {
  id: number;
  docId: string;
  version: number;
  operations: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Permission {
  id: number;
  docId: string;
  userId: string;
  permissions: string[];
  createdAt: Date;
}

export interface DatabaseAdapter {
  createDocument(docId: string, snapshot: any, type: string, meta?: any): Promise<void>;
  getDocument(docId: string): Promise<Document | null>;
  updateSnapshot(docId: string, version: number, snapshot: any): Promise<void>;
  getSnapshotHistory(docId: string, offset: number, limit: number): Promise<Snapshot[]>;
  createOperation(docId: string, version: number, ops: any[]): Promise<void>;
  getOperations(docId: string, version: number): Promise<Operation[]>;
  addUser(userId: string, username: string): Promise<void>;
  getUser(userId: string): Promise<User | null>;
  checkPermission(userId: string, docId: string, action: string): Promise<boolean>;
  grantPermission(userId: string, docId: string, permissions: string[]): Promise<void>;
}
