import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    birthdate: "",
    location: "",
    profession: "General",
    position: "",
    quote: "",
    coping: "",
  });
  const [loading, setLoading] = useState(false);

  const { data: profile } = trpc.profile.get.useQuery();
  const updateProfile = trpc.profile.upsert.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile.mutateAsync(formData);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* User Info */}
      <Card className="p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-semibold">{user?.name || "Not set"}</p>
          <p className="text-sm text-muted-foreground mt-4">Email</p>
          <p className="font-semibold">{user?.email || "Not set"}</p>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">Edit Profile</h2>
        
        <div>
          <label className="text-sm text-muted-foreground">Birthdate</label>
          <Input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Location</label>
          <Input
            name="location"
            placeholder="City, Country"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Department / Role (for translation context)</label>
          <select 
            name="profession"
            value={formData.profession}
            onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
            className="w-full p-2 bg-background border border-input rounded text-sm"
          >
            <option value="General">General Guy</option>
            <option value="Finance">Finance</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Position</label>
          <Input
            name="position"
            placeholder="Your position"
            value={formData.position}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Quote</label>
          <Input
            name="quote"
            placeholder="Your favorite quote"
            value={formData.quote}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Coping Strategy</label>
          <textarea
            name="coping"
            placeholder="Share your coping strategies"
            value={formData.coping}
            onChange={handleChange}
            className="w-full p-2 bg-input border border-border rounded"
            rows={4}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? <Loader2 className="animate-spin" /> : "Save Profile"}
        </Button>
      </Card>
    </div>
  );
}
