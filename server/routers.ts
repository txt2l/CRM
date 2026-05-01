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
      lens: z.string().optional(),
    })).query(async ({ input }) => {
      const rawMessages = await db.getRoomMessages(input.roomId, input.limit, input.offset);
      
      // If a lens is provided, map the messages to show the specific translation
      if (input.lens) {
        return rawMessages.map(msg => {
          const translations = msg.translations as Record<string, string> | null;
          return {
            ...msg,
            // If the translation for the lens exists, use it; otherwise fallback to original content
            displayContent: translations?.[input.lens] || msg.content
          };
        });
      }
      
      return rawMessages.map(msg => ({ ...msg, displayContent: msg.content }));
    }),
    create: protectedProcedure.input(z.object({
      roomId: z.number(),
      content: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      const departments = ["General", "Finance", "Engineering", "Marketing", "HR", "Sales"];
      const userProfile = await db.getProfileByUserId(ctx.user.id.toString());
      const sourceDept = userProfile?.profession || "General";
      
      const systemPrompt = `You are an expert Interdepartmental Translator. 
Your goal is to translate a message from the "${sourceDept}" perspective into multiple versions for other departments: ${departments.join(", ")}.
Ensure the core meaning is preserved but adapted to the specific "lingo" of each department.

Return a JSON object where keys are department names and values are the translated text.
Example format:
{
  "General": "...",
  "Finance": "...",
  "Engineering": "...",
  ...
}`;

      let translations = {};
      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.content }
          ],
          response_format: { type: "json_object" }
        });

        const content = result.choices[0].message.content;
        translations = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (error) {
        console.error("[Translation Error during message creation]", error);
        // Fallback: use original content for all departments
        departments.forEach(dept => {
          translations[dept] = input.content;
        });
      }

      const id = await db.createMessage(input.roomId, ctx.user.id, input.content, translations);
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
      sourceDepartment: z.string().optional(),
      targetDepartment: z.string().default("General"),
    })).mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      const systemPrompt = `You are an expert Interdepartmental Translator. 
Your goal is to translate messages between different professional departments (Finance, Engineering, Marketing, HR, Sales, etc.) and "General" (layperson terms).
Ensure that the core meaning, urgency, and technical accuracy are preserved, but the "lingo" is adapted so the target audience can fully understand it.

Source Context: ${input.sourceDepartment || "Unknown Department"}
Target Audience: ${input.targetDepartment}

Guidelines:
1. If the source is technical (Engineering), explain concepts in terms of business value or general functionality.
2. If the source is financial, explain in terms of budget impact or project resources.
3. If the source is marketing, focus on user impact or brand messaging.
4. Always maintain a professional yet accessible tone.`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.content }
          ]
        });

        const translated = typeof result.choices[0].message.content === 'string' 
          ? result.choices[0].message.content 
          : JSON.stringify(result.choices[0].message.content);

        return { 
          translated, 
          success: true 
        };
      } catch (error) {
        console.error("[Translation Error]", error);
        return { 
          translated: input.content, 
          success: false, 
          error: "Translation service failed" 
        };
      }
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
