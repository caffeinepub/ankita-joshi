import { useEffect, useState } from "react";

const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "504560@AUC";
const STORAGE_KEY = "ankita_admin_logged_in";

export function useAdminAuth() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  const loginAsAdmin = (id: string, password: string): boolean => {
    if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdminLoggedIn(false);
  };

  return { isAdminLoggedIn, loginAsAdmin, logoutAdmin };
}
