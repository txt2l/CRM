import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

export default function Glossary() {
  const { user } = useAuth();
  const [roomId] = useState(1); // Default room for now
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");

  const { data: entries } = trpc.glossary.list.useQuery({ roomId });
  const addEntry = trpc.glossary.add.useMutation();
  const deleteEntry = trpc.glossary.delete.useMutation();

  const handleAdd = async () => {
    if (!newTerm.trim() || !newDef.trim()) return;

    try {
      await addEntry.mutateAsync({
        roomId,
        name: newTerm,
        definition: newDef,
      });
      setNewTerm("");
      setNewDef("");
    } catch (error) {
      console.error("Failed to add glossary entry:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEntry.mutateAsync({ id });
    } catch (error) {
      console.error("Failed to delete glossary entry:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Glossary</h1>
      </div>

      {/* Add Entry Form */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Add New Term</h2>
        <Input
          placeholder="Term"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
        />
        <Input
          placeholder="Definition"
          value={newDef}
          onChange={(e) => setNewDef(e.target.value)}
        />
        <Button onClick={handleAdd} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Term
        </Button>
      </Card>

      {/* Entries List */}
      <div className="space-y-2">
        {entries?.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold">{entry.name}</h3>
                <p className="text-muted-foreground text-sm">{entry.definition}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(entry.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
