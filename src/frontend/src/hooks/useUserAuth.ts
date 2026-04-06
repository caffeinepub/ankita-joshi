import { useState } from "react";

export interface LocalUser {
  id: string;
  username: string;
  password: string;
  name: string;
  bio: string;
  profilePic?: string;
  createdAt: string;
  banned: boolean;
}

const USERS_KEY = "ankita_users";
const SESSION_KEY = "ankita_user_session";

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getStoredUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function useUserAuth() {
  const [loggedInUser, setLoggedInUser] = useState<LocalUser | null>(() => {
    try {
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) return null;
      const users = getStoredUsers();
      return users.find((u) => u.id === sessionId) ?? null;
    } catch {
      return null;
    }
  });

  const register = (
    username: string,
    password: string,
    name: string,
    bio = "",
  ): { success: boolean; error?: string } => {
    const users = getStoredUsers();
    if (
      users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      return { success: false, error: "Username already taken" };
    }
    if (username.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters",
      };
    }
    if (password.length < 4) {
      return {
        success: false,
        error: "Password must be at least 4 characters",
      };
    }
    const newUser: LocalUser = {
      id: generateId(),
      username,
      password,
      name: name || username,
      bio,
      createdAt: new Date().toISOString(),
      banned: false,
    };
    users.push(newUser);
    saveUsers(users);
    sessionStorage.setItem(SESSION_KEY, newUser.id);
    setLoggedInUser(newUser);
    return { success: true };
  };

  const login = (
    username: string,
    password: string,
  ): { success: boolean; error?: string } => {
    const users = getStoredUsers();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password,
    );
    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }
    if (user.banned) {
      return { success: false, error: "Your account has been banned" };
    }
    sessionStorage.setItem(SESSION_KEY, user.id);
    setLoggedInUser(user);
    return { success: true };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setLoggedInUser(null);
  };

  const updateCurrentUser = (
    updates: Partial<Pick<LocalUser, "name" | "bio" | "profilePic">>,
  ) => {
    if (!loggedInUser) return;
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === loggedInUser.id);
    if (idx === -1) return;
    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    saveUsers(users);
    setLoggedInUser(updated);
  };

  // Admin-only helpers
  const getAllUsers = (): LocalUser[] => getStoredUsers();

  const adminUpdateUser = (
    userId: string,
    updates: Partial<Pick<LocalUser, "name" | "bio" | "password" | "banned">>,
  ): boolean => {
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return true;
  };

  const adminDeleteUser = (userId: string): boolean => {
    const users = getStoredUsers();
    const filtered = users.filter((u) => u.id !== userId);
    if (filtered.length === users.length) return false;
    saveUsers(filtered);
    return true;
  };

  const adminResetPassword = (userId: string, newPassword: string): boolean => {
    return adminUpdateUser(userId, { password: newPassword });
  };

  return {
    loggedInUser,
    isUserLoggedIn: !!loggedInUser,
    register,
    login,
    logout,
    updateCurrentUser,
    getAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    adminResetPassword,
  };
}
