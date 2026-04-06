import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  Bookmark,
  Eye,
  Film,
  Globe,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Share2,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Ad, Post } from "../backend.d";
import { PostType } from "../backend.d";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatDistanceToNow } from "../utils/time";

type AnyActor = {
  getUserProfile: (p: unknown) => Promise<unknown>;
  unlikePost: (id: bigint) => Promise<void>;
  likePost: (id: bigint) => Promise<void>;
  unsavePost: (id: bigint) => Promise<void>;
  savePost: (id: bigint) => Promise<void>;
  sharePost: (id: bigint) => Promise<void>;
  addComment: (id: bigint, c: string) => Promise<bigint>;
  deletePost: (id: bigint) => Promise<void>;
  viewPost: (id: bigint) => Promise<void>;
  trackAdView: (id: bigint) => Promise<void>;
  getFeedPosts: () => Promise<Post[]>;
  getAds: () => Promise<Ad[]>;
  getCallerUserProfile: () => Promise<unknown>;
};

type AuthorProfile = { name?: string; username?: string } | null | undefined;

function PostTypeBadge({ type }: { type: PostType }) {
  if (type === PostType.reel)
    return (
      <span className="flex items-center gap-1 text-xs text-pink-400 font-semibold">
        <Film size={11} /> Reel
      </span>
    );
  if (type === PostType.video)
    return (
      <span className="flex items-center gap-1 text-xs text-blue-400 font-semibold">
        <Film size={11} /> Video
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
      <ImageIcon size={11} /> Photo
    </span>
  );
}

function VideoPlayer({ src, autoMuted }: { src: string; autoMuted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(autoMuted);

  const toggleMute = () => {
    setMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  };

  return (
    <div className="relative w-full bg-black">
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[500px] object-contain"
        controls
        muted={muted}
        preload="metadata"
        playsInline
      >
        <track kind="captions" />
      </video>
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-14 right-3 bg-black/60 text-white rounded-full p-1.5 backdrop-blur z-10"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}

function PostCard({
  post,
  myPrincipal,
  actor,
  postIndex,
}: {
  post: Post;
  myPrincipal: string;
  actor: AnyActor;
  postIndex: number;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const isLiked = post.likes.some((p) => p.toString() === myPrincipal);
  const isSaved = post.saves.some((p) => p.toString() === myPrincipal);
  const isMine = post.author.toString() === myPrincipal;

  const { data: authorProfile } = useQuery({
    queryKey: ["profile", post.author.toString()],
    queryFn: () => actor.getUserProfile(post.author) as Promise<AuthorProfile>,
    enabled: !!actor,
  });

  const handleView = () => {
    if (!viewTracked) {
      setViewTracked(true);
      actor.viewPost(post.id).catch(() => {});
    }
  };

  const likeMut = useMutation({
    mutationFn: () =>
      isLiked ? actor.unlikePost(post.id) : actor.likePost(post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      isSaved ? actor.unsavePost(post.id) : actor.savePost(post.id),
    onSuccess: () => {
      toast.success(isSaved ? "Post unsaved" : "Post saved!");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const shareMut = useMutation({
    mutationFn: () => actor.sharePost(post.id),
    onSuccess: () => {
      toast.success("Post shared!");
      qc.invalidateQueries({ queryKey: ["feed"] });
      if (navigator.share) {
        navigator
          .share({ title: "Check this post!", text: post.caption })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
        toast.success("Link copied!");
      }
    },
  });

  const commentMut = useMutation({
    mutationFn: (content: string) => actor.addComment(post.id, content),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => actor.deletePost(post.id),
    onSuccess: () => {
      toast.success("Post deleted");
      setShowDeleteMenu(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const submitComment = () => {
    if (commentText.trim()) commentMut.mutate(commentText.trim());
  };

  const isVideo =
    post.postType === PostType.video || post.postType === PostType.reel;

  const authorName = (authorProfile as AuthorProfile)?.name ?? "User";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const avatarColors = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-500",
    "from-cyan-500 to-blue-500",
  ];
  const colorIndex = post.author.toString().charCodeAt(0) % avatarColors.length;
  const avatarGradient = avatarColors[colorIndex];

  const ocidBase = `post.item.${postIndex + 1}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: postIndex * 0.05 }}
      className="bg-gray-900 rounded-xl border border-gray-800/80 overflow-hidden shadow-md mb-3"
      data-ocid={ocidBase}
    >
      {/* Post Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-left min-w-0"
          onClick={() =>
            navigate({
              to: "/profile/$userId",
              params: { userId: post.author.toString() },
            })
          }
          data-ocid={`${ocidBase}.link`}
        >
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm`}
          >
            {authorInitial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-white leading-tight">
              {authorName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(Number(post.timestamp) / 1_000_000)}
              </span>
              <Globe size={11} className="text-gray-600 flex-shrink-0" />
              <span className="text-gray-700">&middot;</span>
              <PostTypeBadge type={post.postType} />
            </div>
          </div>
        </button>

        {isMine && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowDeleteMenu((v) => !v)}
              className="text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors p-2 rounded-full"
              title="More options"
              data-ocid={`${ocidBase}.open_modal_button`}
            >
              <MoreHorizontal size={18} />
            </button>
            <AnimatePresence>
              {showDeleteMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-9 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                  data-ocid={`${ocidBase}.dropdown_menu`}
                >
                  <button
                    type="button"
                    onClick={() => deleteMut.mutate()}
                    disabled={deleteMut.isPending}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                    data-ocid={`${ocidBase}.delete_button`}
                  >
                    {deleteMut.isPending
                      ? "Deleting..."
                      : "\uD83D\uDDD1 Delete Post"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteMenu(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-700 transition-colors"
                    data-ocid={`${ocidBase}.cancel_button`}
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pb-3 text-sm text-gray-200 leading-relaxed">
          {post.caption}
        </p>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div
          className="bg-gray-950"
          onClick={handleView}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleView();
          }}
          role="presentation"
        >
          {isVideo ? (
            <VideoPlayer src={post.mediaUrl} autoMuted />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption || "Post image"}
              className="w-full max-h-[500px] object-cover"
              onLoad={handleView}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
            &#128077;
          </span>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] -ml-1">
            &#10084;&#65039;
          </span>
          <span className="ml-1">
            {post.likes.length > 0
              ? `${post.likes.length}`
              : "Be the first to like"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {post.comments.length > 0 && (
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="hover:underline"
            >
              {post.comments.length} comment
              {post.comments.length !== 1 ? "s" : ""}
            </button>
          )}
          {Number(post.shares) > 0 && (
            <span>
              {Number(post.shares)} share{Number(post.shares) !== 1 ? "s" : ""}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Eye size={11} /> {post.views.length}
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4">
        <Separator className="bg-gray-800" />
      </div>

      {/* Action Buttons */}
      <div className="flex items-stretch px-1 py-0.5">
        <button
          type="button"
          onClick={() => likeMut.mutate()}
          data-ocid={`${ocidBase}.toggle`}
          className={`flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg transition-all font-medium ${
            isLiked
              ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/15"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          <ThumbsUp
            size={18}
            fill={isLiked ? "currentColor" : "none"}
            className={isLiked ? "text-blue-400" : ""}
          />
          <span>Like</span>
        </button>

        <div className="w-px bg-gray-800 my-2" />

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          data-ocid={`${ocidBase}.button`}
          className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-all font-medium"
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>

        <div className="w-px bg-gray-800 my-2" />

        <button
          type="button"
          onClick={() => shareMut.mutate()}
          data-ocid={`${ocidBase}.secondary_button`}
          className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 transition-all font-medium"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>

        <div className="w-px bg-gray-800 my-2" />

        <button
          type="button"
          onClick={() => saveMut.mutate()}
          data-ocid={`${ocidBase}.save_button`}
          className={`flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg transition-all font-medium ${
            isSaved
              ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/15"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          <Bookmark
            size={18}
            fill={isSaved ? "currentColor" : "none"}
            className={isSaved ? "text-yellow-400" : ""}
          />
          <span>Save</span>
        </button>
      </div>

      {/* Separator */}
      <div className="mx-4">
        <Separator className="bg-gray-800" />
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 space-y-3">
              {post.comments.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-1">
                  No comments yet. Be the first!
                </p>
              ) : (
                post.comments.slice(-3).map((c) => (
                  <div
                    key={c.id.toString()}
                    className="flex gap-2.5 items-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      U
                    </div>
                    <div className="bg-gray-800 rounded-2xl px-3 py-2 flex-1">
                      <p className="text-xs font-semibold text-gray-300 mb-0.5">
                        User
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Input */}
      <div className="flex gap-2.5 items-center px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {myPrincipal ? myPrincipal.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="flex-1 flex items-center bg-gray-800 rounded-full border border-gray-700/50 px-3 pr-1 py-1 focus-within:border-gray-600 transition-colors">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-gray-500 py-1"
            data-ocid={`${ocidBase}.input`}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitComment();
            }}
            onFocus={() => setShowComments(true)}
          />
          {commentText.trim() && (
            <button
              type="button"
              onClick={submitComment}
              disabled={!commentText.trim() || commentMut.isPending}
              className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 rounded-full disabled:opacity-50 transition-colors flex-shrink-0"
              data-ocid={`${ocidBase}.submit_button`}
            >
              Post
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AdCard({ ad, actor }: { ad: Ad; actor: AnyActor }) {
  const handleAdClick = () => {
    actor.trackAdView(ad.id).catch(() => {});
    window.open(ad.targetUrl, "_blank");
  };

  return (
    <article className="bg-gray-900 rounded-xl border border-purple-500/30 overflow-hidden shadow-md mb-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/20 border-b border-purple-500/20">
        <BadgeDollarSign size={13} className="text-purple-400" />
        <span className="text-xs text-purple-400 font-medium">Sponsored</span>
      </div>
      {ad.imageUrl && (
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full max-h-52 object-cover"
        />
      )}
      <div className="p-4 flex items-center justify-between">
        <p className="font-semibold text-white text-sm">{ad.title}</p>
        <button
          type="button"
          onClick={handleAdClick}
          className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Learn more &rarr;
        </button>
      </div>
    </article>
  );
}

function CreatePostBox({ myPrincipal }: { myPrincipal: string }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900 rounded-xl border border-gray-800/80 p-4 mb-3 shadow-md"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {myPrincipal ? myPrincipal.charAt(0).toUpperCase() : "U"}
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/upload" })}
          className="flex-1 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700/60 rounded-full px-4 py-2.5 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          data-ocid="create_post.primary_button"
        >
          What&apos;s on your mind?
        </button>
      </div>
      <Separator className="bg-gray-800 mb-3" />
      <div className="flex items-center justify-around">
        <button
          type="button"
          onClick={() => navigate({ to: "/upload" })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
          data-ocid="create_post.upload_button"
        >
          <Film size={18} className="text-red-400" />
          <span>Video</span>
        </button>
        <div className="w-px h-6 bg-gray-800" />
        <button
          type="button"
          onClick={() => navigate({ to: "/upload" })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
          data-ocid="create_post.secondary_button"
        >
          <ImageIcon size={18} className="text-green-400" />
          <span>Photo</span>
        </button>
        <div className="w-px h-6 bg-gray-800" />
        <button
          type="button"
          onClick={() => navigate({ to: "/upload" })}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors font-medium"
          data-ocid="create_post.button"
        >
          <PenLine size={18} className="text-blue-400" />
          <span>Post</span>
        </button>
      </div>
    </motion.div>
  );
}

const TABS = ["All", "Videos", "Photos", "Reels"] as const;
type Tab = (typeof TABS)[number];

export default function HomePage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: () => actor!.getFeedPosts(),
    enabled: !!actor,
    refetchInterval: 15000,
  });

  const { data: ads } = useQuery({
    queryKey: ["ads"],
    queryFn: () => actor!.getAds(),
    enabled: !!actor,
  });

  const activeAds = ads?.filter((a) => a.active) ?? [];

  const filteredPosts =
    posts?.filter((p) => {
      if (activeTab === "Videos") return p.postType === PostType.video;
      if (activeTab === "Photos") return p.postType === PostType.image;
      if (activeTab === "Reels") return p.postType === PostType.reel;
      return true;
    }) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="feed.loading_state">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3"
          >
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-gray-800" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-36 bg-gray-800" />
                <Skeleton className="h-3 w-24 bg-gray-800" />
              </div>
            </div>
            <Skeleton className="h-4 w-3/4 bg-gray-800 rounded" />
            <Skeleton className="h-56 w-full bg-gray-800 rounded-lg" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 flex-1 bg-gray-800 rounded-lg" />
              <Skeleton className="h-8 flex-1 bg-gray-800 rounded-lg" />
              <Skeleton className="h-8 flex-1 bg-gray-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <CreatePostBox myPrincipal={myPrincipal} />

      <div
        className="flex gap-2 mb-3 overflow-x-auto pb-1"
        data-ocid="feed.tab"
      >
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
            data-ocid={`feed.${tab.toLowerCase()}.tab`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
          data-ocid="feed.empty_state"
        >
          <div className="text-5xl mb-4">&#128248;</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No posts yet
          </h3>
          <p className="text-gray-400 text-sm mb-5">
            Upload your first post or follow people!
          </p>
          <Button
            onClick={() => {}}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            data-ocid="feed.primary_button"
          >
            Create Post
          </Button>
        </motion.div>
      ) : (
        <div>
          {filteredPosts.map((post, idx) => (
            <div key={post.id.toString()}>
              <PostCard
                post={post}
                myPrincipal={myPrincipal}
                actor={actor as AnyActor}
                postIndex={idx}
              />
              {idx > 0 && idx % 4 === 0 && activeAds.length > 0 && (
                <AdCard
                  ad={activeAds[idx % activeAds.length]}
                  actor={actor as AnyActor}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <footer className="text-center py-6 text-xs text-gray-600">
        &copy; {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors"
        >
          Built with &#10084;&#65039; using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
