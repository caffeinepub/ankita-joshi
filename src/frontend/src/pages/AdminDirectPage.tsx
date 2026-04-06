import {
  Ban,
  CheckCircle,
  DollarSign,
  Edit2,
  FileText,
  Key,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { type LocalUser, useUserAuth } from "../hooks/useUserAuth";

const mockStats = {
  totalUsers: 0,
  totalPosts: 0,
  totalEarningsPaid: 0,
};

const TABS = ["Overview", "Users", "Withdrawals", "Ads", "Settings"] as const;
type Tab = (typeof TABS)[number];

type EditingUser = {
  id: string;
  name: string;
  bio: string;
  newPassword: string;
};

export default function AdminDirectPage() {
  const { logoutAdmin } = useAdminAuth();
  const { getAllUsers, adminUpdateUser, adminDeleteUser } = useUserAuth();

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [newRate, setNewRate] = useState("");
  const [adTitle, setAdTitle] = useState("");
  const [adImg, setAdImg] = useState("");
  const [adUrl, setAdUrl] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [_usersVersion, setUsersVersion] = useState(0); // force re-render

  const allUsers = getAllUsers();
  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const handleRateUpdate = () => {
    if (!newRate) return;
    toast.success(`Earning rate updated to \u20b9${newRate}/1000 views!`);
    setNewRate("");
  };

  const handleCreateAd = () => {
    if (!adTitle || !adUrl) return;
    toast.success("Ad created successfully!");
    setAdTitle("");
    setAdImg("");
    setAdUrl("");
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    adminUpdateUser(editingUser.id, {
      name: editingUser.name,
      bio: editingUser.bio,
    });
    if (editingUser.newPassword.trim()) {
      adminUpdateUser(editingUser.id, {
        password: editingUser.newPassword.trim(),
      });
    }
    setEditingUser(null);
    setUsersVersion((v) => v + 1);
    toast.success("User profile updated!");
  };

  const handleDeleteUser = (userId: string) => {
    adminDeleteUser(userId);
    setConfirmDelete(null);
    setUsersVersion((v) => v + 1);
    toast.success("User deleted.");
  };

  const handleBanUser = (user: LocalUser) => {
    adminUpdateUser(user.id, { banned: !user.banned });
    setUsersVersion((v) => v + 1);
    toast.success(user.banned ? "User unbanned." : "User banned.");
  };

  const openEdit = (user: LocalUser) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      bio: user.bio,
      newPassword: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ANKITA JOSHI
            </h1>
            <p className="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logoutAdmin}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20"
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Welcome banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-600/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Welcome, Admin!</p>
              <p className="text-xs text-gray-400">
                ID: admin &bull; Full access enabled
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl mb-6 border border-gray-800 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 flex-1 min-w-0 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
              {tab === "Users" && allUsers.length > 0 && (
                <span className="ml-1 text-xs bg-purple-500/30 text-purple-300 rounded-full px-1.5">
                  {allUsers.length}
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
                  label: "Users",
                  value: allUsers.length.toString(),
                  icon: Users,
                  color: "text-blue-400",
                },
                {
                  label: "Posts",
                  value: mockStats.totalPosts.toString(),
                  icon: FileText,
                  color: "text-purple-400",
                },
                {
                  label: "Paid Out",
                  value: `\u20b9${mockStats.totalEarningsPaid}`,
                  icon: DollarSign,
                  color: "text-green-400",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center"
                >
                  <Icon size={20} className={`${color} mx-auto mb-1`} />
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3">
                Platform Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">
                    Registered Users
                  </span>
                  <span className="text-sm font-semibold text-blue-400">
                    {allUsers.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Banned Users</span>
                  <span className="text-sm font-semibold text-red-400">
                    {allUsers.filter((u) => u.banned).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-400">Active Users</span>
                  <span className="text-sm font-semibold text-green-400">
                    {allUsers.filter((u) => !u.banned).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "Users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">
                User Management ({allUsers.length})
              </h3>
              <button
                type="button"
                onClick={() => setUsersVersion((v) => v + 1)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by username or name..."
              className="bg-gray-800 border-gray-700 text-white"
            />

            {filteredUsers.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <Users size={32} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">
                  {allUsers.length === 0
                    ? "No users registered yet"
                    : "No users match your search"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`bg-gray-900 border rounded-2xl p-4 ${
                      user.banned ? "border-red-500/30" : "border-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-white">
                              {user.name}
                            </p>
                            {user.banned && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                Banned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-purple-400">
                            @{user.username}
                          </p>
                          {user.bio && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {user.bio}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-0.5">
                            ID:{" "}
                            <span className="font-mono">
                              {user.id.slice(0, 20)}...
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-xl transition-colors"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBanUser(user)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-xl transition-colors ${
                          user.banned
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        }`}
                      >
                        {user.banned ? (
                          <>
                            <UserCheck size={13} /> Unban
                          </>
                        ) : (
                          <>
                            <Ban size={13} /> Ban
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(user.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === "Withdrawals" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-green-400" />
              <h3 className="font-semibold text-white">Pending Withdrawals</h3>
            </div>
            <p className="text-gray-500 text-sm">No pending withdrawals</p>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === "Ads" && (
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
                onClick={handleCreateAd}
                disabled={!adTitle || !adUrl}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              >
                <Plus size={16} className="mr-2" /> Create Ad
              </Button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "Settings" && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-1">Earning Rate</h3>
              <p className="text-xs text-gray-500 mb-4">
                Set how much users earn per 1000 views (in \u20b9)
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
                  onClick={handleRateUpdate}
                  disabled={!newRate}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Edit2 size={18} className="text-purple-400" /> Edit User
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="edit-user-name"
                  className="text-sm text-gray-300 font-medium block mb-1"
                >
                  Full Name
                </label>
                <Input
                  id="edit-user-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  placeholder="Full name"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-user-bio"
                  className="text-sm text-gray-300 font-medium block mb-1"
                >
                  Bio
                </label>
                <Input
                  id="edit-user-bio"
                  value={editingUser.bio}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, bio: e.target.value })
                  }
                  placeholder="User bio"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-user-password"
                  className="text-sm text-gray-300 font-medium block mb-1 flex items-center gap-1"
                >
                  <Key size={13} className="text-yellow-400" /> Reset Password
                  <span className="text-gray-500 font-normal text-xs ml-1">
                    (leave blank to keep current)
                  </span>
                </label>
                <Input
                  id="edit-user-password"
                  value={editingUser.newPassword}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="New password"
                  type="password"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveUser}
                  disabled={!editingUser.name}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-red-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Delete User?</h3>
              <p className="text-gray-400 text-sm mt-1">
                This action cannot be undone. The user's account and data will
                be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleDeleteUser(confirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
