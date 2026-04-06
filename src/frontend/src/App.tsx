import {
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import InstallPrompt from "./components/InstallPrompt";
import Layout from "./components/Layout";
import SplashScreen from "./components/SplashScreen";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useUserAuth } from "./hooks/useUserAuth";
import AdminDirectPage from "./pages/AdminDirectPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";
import WalletPage from "./pages/WalletPage";

// Re-export for use in other files via @tanstack/react-router
export { Link, Navigate, useNavigate, useParams };

// ── Guards ──
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdminLoggedIn } = useAdminAuth();
  if (!isAdminLoggedIn) return <Navigate to="/login" />;
  return <>{children}</>;
}

function UserGuard({ children }: { children: React.ReactNode }) {
  const { isAdminLoggedIn } = useAdminAuth();
  const { isUserLoggedIn } = useUserAuth();
  if (isAdminLoggedIn) return <Navigate to="/admin" />;
  if (!isUserLoggedIn) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAdminLoggedIn } = useAdminAuth();
  const { isUserLoggedIn } = useUserAuth();
  if (isAdminLoggedIn) return <Navigate to="/admin" />;
  if (isUserLoggedIn) return <Navigate to="/" />;
  return <>{children}</>;
}

// ── Route Components ──
function LoginRoute() {
  return (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  );
}

function HomeRoute() {
  return (
    <UserGuard>
      <HomePage />
    </UserGuard>
  );
}

function ProfileRoute() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  return (
    <UserGuard>
      <ProfilePage userId={userId} />
    </UserGuard>
  );
}

function UploadRoute() {
  return (
    <UserGuard>
      <UploadPage />
    </UserGuard>
  );
}

function NotificationsRoute() {
  return (
    <UserGuard>
      <NotificationsPage />
    </UserGuard>
  );
}

function WalletRoute() {
  return (
    <UserGuard>
      <WalletPage />
    </UserGuard>
  );
}

function AdminRoute() {
  return (
    <AdminGuard>
      <AdminDirectPage />
    </AdminGuard>
  );
}

function RootRedirect() {
  const { isAdminLoggedIn } = useAdminAuth();
  const { isUserLoggedIn } = useUserAuth();
  useEffect(() => {}, []);
  if (isAdminLoggedIn) return <Navigate to="/admin" />;
  if (isUserLoggedIn) return <Navigate to="/" />;
  return <Navigate to="/login" />;
}

// ── Router Setup ──
const rootRoute = createRootRoute({
  component: () => (
    <div className="dark">
      <Outlet />
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRoute,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeRoute,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: ProfileRoute,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadRoute,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsRoute,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletRoute,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminRoute,
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: RootRedirect,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  homeRoute,
  profileRoute,
  uploadRoute,
  notificationsRoute,
  walletRoute,
  adminRoute,
  catchAllRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        style={{
          opacity: showSplash ? 0 : 1,
          transition: "opacity 0.3s ease",
          pointerEvents: showSplash ? "none" : "auto",
        }}
      >
        <RouterProvider router={router} />
      </div>
      {!showSplash && <InstallPrompt />}
    </>
  );
}
