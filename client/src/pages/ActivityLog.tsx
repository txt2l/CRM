import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";

export default function ActivityLog() {
  const [roomId] = useState(1); // Default room for now

  const { data: logs = [] } = trpc.activityLogs.list.useQuery({
    roomId,
    limit: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Activity Log</h1>

      <div className="space-y-2">
        {logs.map((log: any) => (
          <Card key={log.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-sm">{log.action}</p>
                <p className="text-muted-foreground text-sm">
                  {log.entityType && `${log.entityType}: ${log.entityId}`}
                </p>
                {log.metadata && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {String(JSON.stringify(log.metadata as Record<string, unknown>))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
