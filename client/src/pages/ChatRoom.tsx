import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";

export default function ChatRoom() {
  const [, params] = useRoute("/room/:id");
  const roomId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [targetDept, setTargetDept] = useState("General");

  const { data: room } = trpc.rooms.getById.useQuery(
    { id: roomId! },
    { enabled: !!roomId }
  );

  const { data: messageList } = trpc.messages.list.useQuery(
    { roomId: roomId!, limit: 50 },
    { enabled: !!roomId }
  );

  const createMessage = trpc.messages.create.useMutation();
  const translateMessage = trpc.translate.message.useMutation();

  useEffect(() => {
    if (messageList) {
      setMessages([...messageList].reverse());
    }
  }, [messageList]);

  const handleSendMessage = async () => {
    if (!input.trim() || !roomId || !user) return;

    setLoading(true);
    try {
      await createMessage.mutateAsync({
        roomId,
        content: input,
      });
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (messageId: number, content: string) => {
    try {
      const result = await translateMessage.mutateAsync({
        content,
        targetDepartment: targetDept,
      });
      if (result.success && result.translated) {
        setTranslations(prev => ({ ...prev, [messageId]: result.translated }));
      }
    } catch (error) {
      console.error("Translation failed:", error);
    }
  };

  if (!roomId) return <div>Invalid room</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{room?.name || "Loading..."}</h1>
          {room?.description && (
            <p className="text-muted-foreground text-sm">{room.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Translate to:</span>
          <select 
            value={targetDept} 
            onChange={(e) => setTargetDept(e.target.value)}
            className="bg-background border border-input rounded px-2 py-1 text-sm"
          >
            <option value="General">General Guy</option>
            <option value="Finance">Finance</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id} className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-primary mb-1">User #{msg.userId}</p>
                  <p className="text-foreground">{msg.content}</p>
                  
                  {translations[msg.id] && (
                    <div className="mt-3 p-2 bg-muted/50 rounded-md border-l-2 border-primary">
                      <p className="text-xs font-bold text-primary uppercase mb-1">{targetDept} Translation:</p>
                      <p className="text-sm italic">{translations[msg.id]}</p>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4"
                  onClick={() => handleTranslate(msg.id as number, msg.content)}
                  disabled={translateMessage.isPending}
                >
                  {translateMessage.isPending ? <Loader2 className="size-3 animate-spin" /> : "Decode Lingo"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={loading}
        />
        <Button onClick={handleSendMessage} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
    </div>
  );
}
