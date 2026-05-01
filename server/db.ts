import { eq, desc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  rooms, 
  messages, 
  activityLogs, 
  glossary,
  userProfiles,
  roomMembers,
  type Room,
  type Message,
  type ActivityLog,
  type GlossaryEntry,
  type RoomMember,
  type UserProfile,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Management ───

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

// ─── User Profiles ───

export async function getProfileByUserId(userId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, parseInt(userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertProfile(userId: string, data: Partial<UserProfile>) {
  const db = await getDb();
  if (!db) return;

  const userIdNum = parseInt(userId);
  const existing = await getProfileByUserId(userId);

  if (existing) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userIdNum));
  } else {
    await db.insert(userProfiles).values({
      userId: userIdNum,
      ...data,
    });
  }
}

// ─── Room Management ───

export async function getUserRooms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(rooms).where(eq(rooms.createdBy, userId));
}

export async function createRoom(name: string, description: string | null, userId: number, parentId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(rooms).values({
    name,
    description,
    createdBy: userId,
    parentId: parentId ? parseInt(parentId) : null,
  });

  return result[0].insertId;
}

export async function updateRoom(id: number, data: Partial<Room>) {
  const db = await getDb();
  if (!db) return;

  await db.update(rooms).set(data).where(eq(rooms.id, id));
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(rooms).where(eq(rooms.id, id));
}

export async function searchRooms(query: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(rooms).where(like(rooms.name, `%${query}%`));
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ─── Room Members ───

export async function addRoomMember(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.insert(roomMembers).values({
    roomId,
    userId,
  });

  // Increment member count
  await db.update(rooms).set({
    memberCount: sql`memberCount + 1`,
  }).where(eq(rooms.id, roomId));
}

export async function removeRoomMember(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));

  // Decrement member count
  await db.update(rooms).set({
    memberCount: sql`memberCount - 1`,
  }).where(eq(rooms.id, roomId));
}

export async function getRoomMembers(roomId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId));
}

// ─── Messages ───

export async function createMessage(roomId: number, userId: number, content: string, translations?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values({
    roomId,
    userId,
    content,
    translations,
  });

  return result[0].insertId;
}

export async function getRoomMessages(roomId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function deleteMessage(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(messages).where(eq(messages.id, id));
}

// ─── Activity Logs ───

export async function logEvent(data: {
  roomId: number;
  userId: number;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(activityLogs).values({
    roomId: data.roomId,
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    metadata: data.metadata,
  });
}

export async function getRoomActivityLogs(roomId: number, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(activityLogs)
    .where(eq(activityLogs.roomId, roomId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getActivityLogsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

// ─── Glossary ───

export async function getGlossary(roomId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (roomId) {
    return db.select().from(glossary).where(eq(glossary.roomId, roomId));
  }
  return db.select().from(glossary);
}

export async function createGlossaryEntry(data: {
  id: string;
  roomId: number;
  name: string;
  definition: string;
  attachments?: unknown;
  createdBy: string;
  createdAt: Date;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(glossary).values({
    roomId: data.roomId,
    name: data.name,
    definition: data.definition,
    attachments: data.attachments,
    createdBy: parseInt(data.createdBy),
    createdAt: data.createdAt,
  });
}

export async function deleteGlossaryEntry(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(glossary).where(eq(glossary.id, id));
}

export async function searchGlossary(roomId: number, query: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(glossary)
    .where(and(eq(glossary.roomId, roomId), like(glossary.name, `%${query}%`)));
}
