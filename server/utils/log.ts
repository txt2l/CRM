import * as db from "../db";

export async function logEvent(data: {
  userId: number;
  roomId: number;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.logEvent(data);
  } catch (error) {
    console.error("[LogEvent] Failed to log event:", error);
  }
}
