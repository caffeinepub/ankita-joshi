import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import type { ReactElement } from "react";
import { NotificationType } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { formatDistanceToNow } from "../utils/time";

function notifIcon(type: NotificationType): ReactElement {
  switch (type) {
    case NotificationType.like:
      return <Heart size={16} className="text-pink-400" />;
    case NotificationType.comment:
      return <MessageCircle size={16} className="text-blue-400" />;
    case NotificationType.follow:
      return <UserPlus size={16} className="text-green-400" />;
    case NotificationType.friendRequest:
      return <Users size={16} className="text-yellow-400" />;
    default:
      return <Bell size={16} className="text-gray-400" />;
  }
}

export default function NotificationsPage() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: notifs, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => actor!.getNotifications(),
    enabled: !!actor,
  });

  const readMut = useMutation({
    mutationFn: (id: bigint) => actor!.markNotificationAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-2xl p-4 flex gap-3 animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifs || notifs.length === 0) {
    return (
      <div className="text-center py-16">
        <Bell size={48} className="mx-auto text-gray-700 mb-3" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No notifications
        </h3>
        <p className="text-gray-400">We'll notify you when something happens</p>
      </div>
    );
  }

  const sorted = [...notifs].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Notifications</h2>
        <span className="text-sm text-gray-400">
          {notifs.filter((n) => !n.read).length} unread
        </span>
      </div>
      <div className="space-y-2">
        {sorted.map((n) => (
          <div
            key={n.id.toString()}
            className={`flex items-start gap-3 p-4 rounded-2xl transition-all ${n.read ? "bg-gray-900" : "bg-gray-900 border border-purple-500/30"} ${!n.read ? "cursor-pointer" : ""}`}
            onClick={() => !n.read && readMut.mutate(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !n.read) readMut.mutate(n.id);
            }}
            tabIndex={n.read ? -1 : 0}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              {notifIcon(n.notifType)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-200">{n.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(Number(n.timestamp) / 1_000_000)}
              </p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
