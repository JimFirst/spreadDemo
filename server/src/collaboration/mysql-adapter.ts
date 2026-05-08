import { PrismaClient } from '@prisma/client';
import { DatabaseAdapter, Document, Snapshot, Operation, User } from './types';

export class MySQLAdapter implements DatabaseAdapter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createDocument(docId: string, snapshot: any, type: string, meta?: any): Promise<void> {
    await this.prisma.document.upsert({
      where: { id: docId },
      update: {
        snapshot: JSON.stringify(snapshot),
        version: 0,
        type,
      },
      create: {
        id: docId,
        snapshot: JSON.stringify(snapshot),
        version: 0,
        type,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  }

  async getDocument(docId: string): Promise<Document | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });
    
    if (!doc) return null;
    
    return {
      id: doc.id,
      type: doc.type,
      snapshot: doc.snapshot,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async updateSnapshot(docId: string, version: number, snapshot: any): Promise<void> {
    await this.prisma.document.update({
      where: { id: docId },
      data: {
        snapshot: JSON.stringify(snapshot),
        version,
        updatedAt: new Date(),
      },
    });
  }

  async getSnapshotHistory(docId: string, offset: number, limit: number): Promise<Snapshot[]> {
    const snapshots = await this.prisma.snapshot.findMany({
      where: { docId },
      orderBy: { version: 'desc' },
      skip: offset,
      take: limit,
    });

    return snapshots.map(s => ({
      id: s.id,
      docId: s.docId,
      version: s.version,
      data: s.data,
      createdAt: s.createdAt,
    }));
  }

  async createOperation(docId: string, version: number, ops: any[]): Promise<void> {
    await this.prisma.snapshot.create({
      data: {
        docId,
        version,
        data: JSON.stringify(ops),
      },
    });

    await this.prisma.document.update({
      where: { id: docId },
      data: {
        version,
      },
    });
  }

  async getOperations(docId: string, version: number): Promise<Operation[]> {
    const snapshots = await this.prisma.snapshot.findMany({
      where: {
        docId,
        version: { gt: version },
      },
      orderBy: { version: 'asc' },
    });

    return snapshots.map(s => ({
      id: s.id,
      docId: s.docId,
      version: s.version,
      operations: s.data,
      createdAt: s.createdAt,
    }));
  }

  async addUser(userId: string, username: string): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: { name: username },
      create: {
        id: userId,
        name: username,
      },
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  async checkPermission(userId: string, docId: string, action: string): Promise<boolean> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        docId_userId: {
          docId,
          userId,
        },
      },
    });

    if (!permission) {
      return action === 'read';
    }

    const permissions = JSON.parse(permission.permissions) as string[];
    return permissions.includes(action);
  }

  async grantPermission(userId: string, docId: string, permissions: string[]): Promise<void> {
    await this.prisma.permission.upsert({
      where: {
        docId_userId: {
          docId,
          userId,
        },
      },
      update: {
        permissions: JSON.stringify(permissions),
      },
      create: {
        docId,
        userId,
        permissions: JSON.stringify(permissions),
      },
    });
  }
}
