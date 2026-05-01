import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: rooms } = trpc.rooms.list.useQuery();
  const createRoom = trpc.rooms.create.useMutation();

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const result = await createRoom.mutateAsync({
        name: newRoomName,
        description: newRoomDesc,
      });
      setNewRoomName("");
      setNewRoomDesc("");
      setShowCreateForm(false);
      setLocation(`/room/${result.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Chat Rooms</h1>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Room
          </Button>
        </div>

        {/* Create Room Form */}
        {showCreateForm && (
          <Card className="p-4 space-y-3">
            <Input
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateRoom} className="flex-1">
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms?.map((room) => (
            <Card
              key={room.id}
              className="p-4 cursor-pointer hover:bg-card-foreground/5 transition-colors"
              onClick={() => setLocation(`/room/${room.id}`)}
            >
              <h3 className="font-semibold text-lg">{room.name}</h3>
              {room.description && (
                <p className="text-muted-foreground text-sm">{room.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {room.memberCount} members
              </p>
            </Card>
          ))}
        </div>

        {rooms?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No rooms yet. Create one to get started!
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
