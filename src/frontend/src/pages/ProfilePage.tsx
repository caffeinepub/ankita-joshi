import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit2,
  Grid,
  Image as ImageIcon,
  Play,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  userId: string;
}

export default function ProfilePage({ userId }: Props) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";
  const isMe = userId === "me" || userId === myPrincipal;

  const targetPrincipal = isMe
    ? identity?.getPrincipal()
    : (() => {
        try {
          return Principal.fromText(userId!);
        } catch {
          return null;
        }
      })();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", isMe ? "me" : userId],
    queryFn: () =>
      isMe
        ? actor!.getCallerUserProfile()
        : actor!.getUserProfile(targetPrincipal!),
    enabled: !!actor && !!targetPrincipal,
  });

  const { data: posts } = useQuery({
    queryKey: ["userPosts", isMe ? myPrincipal : userId],
    queryFn: () => actor!.getUserPosts(targetPrincipal!),
    enabled: !!actor && !!targetPrincipal,
  });

  const isFollowing = profile?.followers.some(
    (f) => f.toString() === myPrincipal,
  );

  const followMut = useMutation({
    mutationFn: () =>
      isFollowing
        ? actor!.unfollowUser(targetPrincipal!)
        : actor!.followUser(targetPrincipal!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(isFollowing ? "Unfollowed" : "Now following!");
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editName, setEditName] = useState("");

  const openEdit = () => {
    setEditBio(profile?.bio ?? "");
    setEditName(profile?.name ?? "");
    setEditOpen(true);
  };

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      await actor!.saveCallerUserProfile({
        ...profile,
        name: editName,
        bio: editBio,
      });
    },
    onSuccess: () => {
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("Profile updated!");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full bg-gray-800 rounded-2xl" />
        <div className="flex gap-4">
          <Skeleton className="w-20 h-20 rounded-full bg-gray-800" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-32 bg-gray-800" />
            <Skeleton className="h-3 w-24 bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="text-center py-10 text-gray-400">Profile not found</div>
    );

  return (
    <div>
      <div className="h-32 bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl mb-4" />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white -mt-10 border-4 border-gray-950">
            {profile.name?.charAt(0) ?? "?"}
          </div>
          <div className="pt-1">
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
          </div>
        </div>
        {isMe ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openEdit}
            className="border-gray-700 text-gray-300 hover:text-white"
          >
            <Edit2 size={14} className="mr-1" /> Edit
          </Button>
        ) : (
          <Button
            onClick={() => followMut.mutate()}
            size="sm"
            className={
              isFollowing
                ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                : "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
            }
          >
            {isFollowing ? (
              <>
                <UserMinus size={14} className="mr-1" /> Unfollow
              </>
            ) : (
              <>
                <UserPlus size={14} className="mr-1" /> Follow
              </>
            )}
          </Button>
        )}
      </div>

      {profile.bio && (
        <p className="text-gray-300 text-sm mb-4">{profile.bio}</p>
      )}

      <div className="flex gap-6 mb-6">
        {[
          { label: "Posts", val: posts?.length ?? 0 },
          { label: "Followers", val: profile.followers.length },
          { label: "Following", val: profile.following.length },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="font-bold text-white">{val}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
        <div className="text-center">
          <p className="font-bold text-green-400">
            &#8377;{(Number(profile.totalEarnings) / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Earned</p>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center gap-2 mb-3 text-gray-400">
          <Grid size={18} />
          <span className="text-sm font-medium">Posts</span>
        </div>
        {!posts || posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No posts yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div
                key={post.id.toString()}
                className="aspect-square bg-gray-800 rounded-lg overflow-hidden relative group cursor-pointer"
              >
                {post.mediaUrl ? (
                  post.postType === "video" || post.postType === "reel" ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Play size={24} className="text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">
                    &#10084; {post.likes.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm text-gray-400 mb-1"
              >
                Name
              </label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label
                htmlFor="edit-bio"
                className="block text-sm text-gray-400 mb-1"
              >
                Bio
              </label>
              <textarea
                id="edit-bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <Button
              type="button"
              onClick={() => saveEdit.mutate()}
              disabled={saveEdit.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white"
            >
              {saveEdit.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
