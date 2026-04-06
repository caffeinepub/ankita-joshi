import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Film,
  Image as ImageIcon,
  Loader2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PostType } from "../backend.d";
import { Button } from "../components/ui/button";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { StorageClient } from "../utils/StorageClient";

export default function UploadPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState<PostType>(PostType.image);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (f.type.startsWith("video")) setPostType(PostType.video);
    else setPostType(PostType.image);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!actor || !file) return;
      setUploading(true);
      try {
        const config = await loadConfig();
        const agent = new HttpAgent({
          host: config.backend_host,
          identity: identity ?? undefined,
        });
        if (config.backend_host?.includes("localhost"))
          await agent.fetchRootKey().catch(() => {});
        const storageClient = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes, (pct) =>
          setUploadProgress(pct),
        );
        const mediaUrl = await storageClient.getDirectURL(hash);
        await actor.createPost(caption, mediaUrl, postType);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    onSuccess: () => {
      toast.success("Posted! Your post is live");
      qc.invalidateQueries({ queryKey: ["feed"] });
      navigate({ to: "/" });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    },
  });

  const postTypes = [
    { type: PostType.image, label: "Image", icon: ImageIcon },
    { type: PostType.video, label: "Video", icon: Video },
    { type: PostType.reel, label: "Reel", icon: Film },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Create Post</h2>
      <div className="flex gap-2 mb-4">
        {postTypes.map(({ type, label, icon: Icon }) => (
          <button
            type="button"
            key={type}
            onClick={() => setPostType(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              postType === type
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter") fileRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          role="presentation"
        >
          <Upload size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">
            Drop your file here or click to upload
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Images, videos, reels supported
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setFile(null);
            }}
            className="absolute top-2 right-2 z-10 bg-gray-900/80 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
          {file?.type.startsWith("video") ? (
            <video
              src={preview}
              controls
              className="w-full rounded-2xl max-h-64 object-cover bg-gray-800"
            >
              <track kind="captions" />
            </video>
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-2xl max-h-64 object-cover"
            />
          )}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="post-caption"
          className="block text-sm text-gray-400 mb-2"
        >
          Caption
        </label>
        <textarea
          id="post-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => createMut.mutate()}
        disabled={!file || uploading || createMut.isPending}
        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-xl py-3"
      >
        {uploading || createMut.isPending ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" /> Posting...
          </>
        ) : (
          "Post"
        )}
      </Button>
    </div>
  );
}
