import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";

interface Props {
  onDone: () => void;
}

export default function SetupPage({ onDone }: Props) {
  const { actor } = useActor();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !name.trim() || !username.trim()) return;
    setLoading(true);
    try {
      await actor.createUserProfile(
        name.trim(),
        username.trim().toLowerCase(),
        bio.trim(),
      );
      toast.success("Profile created! Welcome to ANKITA JOSHI");
      onDone();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Profile</h1>
          <p className="text-gray-400 mt-1">Tell us about yourself</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4"
        >
          <div>
            <label
              htmlFor="setup-name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Full Name *
            </label>
            <Input
              id="setup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="setup-username"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Username *
            </label>
            <Input
              id="setup-username"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase(),
                )
              }
              placeholder="@username"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="setup-bio"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Bio
            </label>
            <textarea
              id="setup-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim() || !username.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-xl"
          >
            {loading ? "Creating..." : "Create Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}
