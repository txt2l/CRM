import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { logEvent } from "./utils/log";
import { randomUUID } from "crypto";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ───
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getProfileByUserId(ctx.user.id.toString());
      return { ...ctx.user, profile };
    }),
    upsert: protectedProcedure.input(z.object({
      birthdate: z.string().optional(),
      location: z.string().optional(),
      profession: z.string().optional(),
      position: z.string().optional(),
      skills: z.any().optional(),
      interests: z.any().optional(),
      quote: z.string().optional(),
      websites: z.any().optional(),
      socials: z.any().optional(),
      coping: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertProfile(ctx.user.id.toString(), input);
      await logEvent({ userId: ctx.user.id, roomId: 0, action: "profile_updated", metadata: input });
      return { success: true };
    }),
  }),

  // ─── Team ───
  team: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUsers();
    }),
  }),

  // ─── Rooms ───
  rooms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserRooms(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      parentId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createRoom(input.name, input.description ?? null, ctx.user.id, input.parentId);
      await logEvent({ 
        userId: ctx.user.id, 
        roomId: id as number, 
        action: "room_created", 
        entityType: "room", 
        entityId: id.toString(), 
        metadata: { name: input.name } 
      });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      parentId: z.string().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateRoom(id, data as any);
      await logEvent({ 
        userId: ctx.user.id, 
        roomId: id, 
        action: "room_updated", 
        entityType: "room", 
        entityId: id.toString(), 
        metadata: data 
      });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteRoom(input.id);
      await logEvent({ 
        userId: ctx.user.id, 
        roomId: input.id, 
        action: "room_deleted", 
        entityType: "room", 
        entityId: input.id.toString() 
      });
      return { success: true };
    }),
    search: protectedProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
      return db.searchRooms(input.q);
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getRoomById(input.id);
    }),
  }),

  // ─── Messages ───
  messages: router({
    list: protectedProcedure.input(z.object({
      roomId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      return db.getRoomMessages(input.roomId, input.limit, input.offset);
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      content: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createMessage(input.roomId, ctx.user.id, input.content);
      await logEvent({
        userId: ctx.user.id,
        roomId: input.roomId,
        action: "message_created",
        entityType: "message",
        entityId: id.toString(),
        metadata: { preview: input.content.substring(0, 100) },
      });
      return { id, success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteMessage(input.id);
      return { success: true };
    }),
  }),

  // ─── Glossary ───
  glossary: router({
    list: protectedProcedure.input(z.object({
      roomId: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getGlossary(input.roomId);
    }),
    add: protectedProcedure.input(z.object({
      roomId: z.number(),
      name: z.string().max(128),
      definition: z.string().max(1000),
      attachments: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await db.createGlossaryEntry({
        id,
        roomId: input.roomId,
        name: input.name,
        definition: input.definition,
        attachments: input.attachments,
        createdBy: ctx.user.id.toString(),
        createdAt: new Date(),
      });
      await logEvent({
        userId: ctx.user.id,
        roomId: input.roomId,
        action: "glossary_added",
        metadata: { name: input.name },
      });
      return { id };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteGlossaryEntry(input.id);
      return { success: true };
    }),
    search: protectedProcedure.input(z.object({
      roomId: z.number(),
      query: z.string(),
    })).query(async ({ input }) => {
      return db.searchGlossary(input.roomId, input.query);
    }),
  }),

  // ─── Activity Logs ───
  activityLogs: router({
    list: protectedProcedure.input(z.object({
      roomId: z.number(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      return db.getRoomActivityLogs(input.roomId, input.limit, input.offset);
    }),
  }),

  // ─── Translation ───
  translate: router({
    message: protectedProcedure.input(z.object({
      content: z.string(),
      targetLanguage: z.string().default("en"),
    })).mutation(async ({ ctx, input }) => {
      // Translation feature requires external LLM service
      // Placeholder: return original text with note
      console.log("[Translation] Placeholder - integrate with external LLM service");
      return { translated: input.content, success: true, note: "Translation service not configured - integrate with external LLM" };
    }),
  }),

  // ─── Presence ───
  presence: router({
    counts: protectedProcedure.query(async () => {
      const users = await db.getAllUsers();
      return { total: users.length };
    }),
  }),
});

export type AppRouter = typeof appRouter;
