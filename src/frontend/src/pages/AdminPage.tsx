import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WithdrawalStatus } from "../backend.d";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";

const TABS = ["Overview", "Withdrawals", "Ads", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor,
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => actor!.getAdminStats(),
    enabled: !!actor && !!isAdmin,
    refetchInterval: 30000,
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["allWithdrawals"],
    queryFn: () => actor!.getPendingWithdrawals(),
    enabled: !!actor && !!isAdmin,
  });

  const { data: ads, refetch: refetchAds } = useQuery({
    queryKey: ["adminAds"],
    queryFn: () => actor!.getAds(),
    enabled: !!actor && !!isAdmin,
  });

  const approveMut = useMutation({
    mutationFn: (id: bigint) => actor!.approveWithdrawal(id),
    onSuccess: () => {
      toast.success("Withdrawal approved!");
      refetchWithdrawals();
    },
  });

  const rejectMut = useMutation({
    mutationFn: (id: bigint) => actor!.rejectWithdrawal(id),
    onSuccess: () => {
      toast.success("Withdrawal rejected");
      refetchWithdrawals();
    },
  });

  const [newRate, setNewRate] = useState("");
  const rateMut = useMutation({
    mutationFn: () =>
      actor!.updateEarningRate(
        BigInt(Math.round(Number.parseFloat(newRate) * 100)),
      ),
    onSuccess: () => {
      toast.success(`Earning rate updated to ₹${newRate}/1000 views!`);
      setNewRate("");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Error"),
  });

  const [adTitle, setAdTitle] = useState("");
  const [adImg, setAdImg] = useState("");
  const [adUrl, setAdUrl] = useState("");
  const adMut = useMutation({
    mutationFn: () => actor!.createAd(adTitle, adImg, adUrl),
    onSuccess: () => {
      toast.success("Ad created!");
      setAdTitle("");
      setAdImg("");
      setAdUrl("");
      refetchAds();
    },
  });

  if (checkingAdmin) {
    return (
      <div className="text-center py-16">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Checking access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-white">Access Denied</h3>
        <p className="text-gray-400 mt-2">Admin access required</p>
      </div>
    );
  }

  const pendingWithdrawals =
    withdrawals?.filter((w) => w.status === WithdrawalStatus.pending) ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-xs text-gray-500">Full platform control</p>
        </div>
        <button
          type="button"
          onClick={() => {
            refetchStats();
            refetchWithdrawals();
            refetchAds();
            toast.success("Refreshed!");
          }}
          className="ml-auto p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
          title="Refresh data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-6 border border-gray-800">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
            {tab === "Withdrawals" && pendingWithdrawals.length > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "Overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total Users",
                value: stats?.totalUsers?.toString() ?? "...",
                icon: Users,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "Total Posts",
                value: stats?.totalPosts?.toString() ?? "...",
                icon: FileText,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                label: "Paid Out",
                value: `₹${(Number(stats?.totalEarningsPaid ?? 0) / 100).toFixed(0)}`,
                icon: DollarSign,
                color: "text-green-400",
                bg: "bg-green-500/10",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className={`${bg} border border-gray-800 rounded-2xl p-4 text-center`}
              >
                <Icon size={20} className={`${color} mx-auto mb-2`} />
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-3">Platform Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">
                  Pending Withdrawals
                </span>
                <span
                  className={`text-sm font-semibold ${pendingWithdrawals.length > 0 ? "text-yellow-400" : "text-green-400"}`}
                >
                  {pendingWithdrawals.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Active Ads</span>
                <span className="text-sm font-semibold text-blue-400">
                  {ads?.filter((a) => a.active).length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Total Ads</span>
                <span className="text-sm font-semibold text-gray-300">
                  {ads?.length ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "Withdrawals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">
              Pending Withdrawals ({pendingWithdrawals.length})
            </h3>
            <button
              type="button"
              onClick={() => refetchWithdrawals()}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <CheckCircle size={32} className="mx-auto text-green-400 mb-3" />
              <p className="text-gray-400">No pending withdrawals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((w) => (
                <div
                  key={w.id.toString()}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold text-white">
                        ₹{(Number(w.amount) / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {w.method.__kind__.toUpperCase()} &bull; User:{" "}
                        {w.user.toString().slice(0, 16)}...
                      </p>
                      {w.method.__kind__ === "upi" && (
                        <p className="text-xs text-purple-400 mt-1">
                          UPI:{" "}
                          {(w.method as { __kind__: "upi"; upi: string }).upi}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">
                      Pending
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approveMut.mutate(w.id)}
                      disabled={approveMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors text-sm font-medium"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMut.mutate(w.id)}
                      disabled={rejectMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors text-sm font-medium"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All withdrawals history */}
          {withdrawals &&
            withdrawals.filter((w) => w.status !== WithdrawalStatus.pending)
              .length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  History
                </h4>
                <div className="space-y-2">
                  {withdrawals
                    .filter((w) => w.status !== WithdrawalStatus.pending)
                    .map((w) => (
                      <div
                        key={w.id.toString()}
                        className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                      >
                        <div>
                          <p className="text-sm text-white">
                            ₹{(Number(w.amount) / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {w.method.__kind__.toUpperCase()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-lg ${
                            w.status === WithdrawalStatus.approved
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === "Ads" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-purple-400" /> Create New Ad
            </h3>
            <div className="space-y-3">
              <Input
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="Ad Title"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Input
                value={adImg}
                onChange={(e) => setAdImg(e.target.value)}
                placeholder="Image URL (optional)"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Input
                value={adUrl}
                onChange={(e) => setAdUrl(e.target.value)}
                placeholder="Target URL"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                type="button"
                onClick={() => adMut.mutate()}
                disabled={adMut.isPending || !adTitle || !adUrl}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              >
                <Plus size={16} className="mr-2" /> Create Ad
              </Button>
            </div>
          </div>

          {ads && ads.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3">
                All Ads ({ads.length})
              </h3>
              <div className="space-y-3">
                {ads.map((ad) => (
                  <div
                    key={ad.id.toString()}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ad.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Number(ad.views)} views
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-lg ${
                        ad.active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {ad.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "Settings" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-1">Earning Rate</h3>
            <p className="text-xs text-gray-500 mb-4">
              Set how much users earn per 1000 views (in ₹)
            </p>
            <div className="flex gap-3">
              <Input
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="e.g. 10"
                type="number"
                min="0"
                className="bg-gray-800 border-gray-700 text-white flex-1"
              />
              <Button
                type="button"
                onClick={() => rateMut.mutate()}
                disabled={rateMut.isPending || !newRate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Update
              </Button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-1">Danger Zone</h3>
            <p className="text-xs text-gray-500 mb-4">
              Destructive admin actions
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div>
                  <p className="text-sm text-white">Ban User</p>
                  <p className="text-xs text-gray-500">
                    Block a user from the platform
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg"
                >
                  <Ban size={14} /> Ban
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div>
                  <p className="text-sm text-white">Delete Post</p>
                  <p className="text-xs text-gray-500">Remove any post by ID</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
