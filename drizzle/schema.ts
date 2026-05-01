import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  json,
  bigint,
  index,
  foreignKey
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles table for extended profile information
 */
export const userProfiles = mysqlTable("user_profiles", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  birthdate: varchar("birthdate", { length: 10 }),
  location: varchar("location", { length: 255 }),
  profession: varchar("profession", { length: 255 }),
  position: varchar("position", { length: 255 }),
  skills: json("skills"),
  interests: json("interests"),
  quote: text("quote"),
  websites: json("websites"),
  socials: json("socials"),
  coping: text("coping"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Chat rooms table
 */
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: int("parentId"),
  memberCount: int("memberCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_createdBy").on(table.createdBy),
  index("idx_parentId").on(table.parentId),
]);

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Room members table for tracking who's in each room
 */
export const roomMembers = mysqlTable("room_members", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_roomId").on(table.roomId),
  index("idx_userId").on(table.userId),
]);

export type RoomMember = typeof roomMembers.$inferSelect;
export type InsertRoomMember = typeof roomMembers.$inferInsert;

/**
 * Messages table for chat history
 */
export const messages = mysqlTable("messages", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_roomId").on(table.roomId),
  index("idx_userId").on(table.userId),
  index("idx_createdAt").on(table.createdAt),
]);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Activity logs table for tracking room events
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 64 }).notNull(), // "join", "leave", "message", "translate", "glossary_add", etc.
  entityType: varchar("entityType", { length: 64 }), // "room", "message", "glossary", etc.
  entityId: varchar("entityId", { length: 64 }),
  metadata: json("metadata"), // Additional context (message preview, translation, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_roomId").on(table.roomId),
  index("idx_userId").on(table.userId),
  index("idx_action").on(table.action),
  index("idx_createdAt").on(table.createdAt),
]);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Glossary table for shared terminology within rooms
 */
export const glossary = mysqlTable("glossary", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  definition: text("definition").notNull(),
  attachments: json("attachments"),
  createdBy: int("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_roomId").on(table.roomId),
  index("idx_createdBy").on(table.createdBy),
]);

export type GlossaryEntry = typeof glossary.$inferSelect;
export type InsertGlossaryEntry = typeof glossary.$inferInsert;
