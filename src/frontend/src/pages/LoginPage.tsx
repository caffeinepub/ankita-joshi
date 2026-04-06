import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Shield, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useUserAuth } from "../hooks/useUserAuth";

export default function LoginPage() {
  const { loginAsAdmin, isAdminLoggedIn } = useAdminAuth();
  const { login, register, isUserLoggedIn } = useUserAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"admin" | "user">("user");
  const [userMode, setUserMode] = useState<"login" | "register">("login");

  // Admin fields
  const [adminId, setAdminId] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // User login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // User register fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regBio, setRegBio] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn) navigate({ to: "/admin" });
  }, [isAdminLoggedIn, navigate]);

  useEffect(() => {
    if (isUserLoggedIn) navigate({ to: "/" });
  }, [isUserLoggedIn, navigate]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);
    setTimeout(() => {
      const ok = loginAsAdmin(adminId.trim(), adminPass);
      if (ok) {
        toast.success("Admin login successful!");
        navigate({ to: "/admin" });
      } else {
        setAdminError("Invalid ID or Password. Please try again.");
      }
      setAdminLoading(false);
    }, 600);
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    setTimeout(() => {
      const result = login(loginUsername.trim(), loginPassword);
      if (result.success) {
        toast.success("Login successful! Welcome back.");
        navigate({ to: "/" });
      } else {
        setLoginError(result.error ?? "Login failed");
      }
      setLoginLoading(false);
    }, 600);
  };

  const handleUserRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    setTimeout(() => {
      const result = register(
        regUsername.trim(),
        regPassword,
        regName.trim(),
        regBio.trim(),
      );
      if (result.success) {
        toast.success("Account created! Welcome to ANKITA JOSHI.");
        navigate({ to: "/" });
      } else {
        setRegError(result.error ?? "Registration failed");
      }
      setRegLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <span className="text-white text-4xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ANKITA JOSHI
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Connect. Create. Earn.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-900 rounded-2xl p-1 mb-6 border border-gray-800">
          <button
            type="button"
            onClick={() => {
              setTab("user");
              setLoginError("");
              setRegError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "user"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users size={16} />
            User Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("admin");
              setAdminError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "admin"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Shield size={16} />
            Admin Login
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
          {tab === "admin" ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  Admin Panel
                </h2>
                <p className="text-gray-400 text-sm mb-5">
                  Enter your admin credentials to continue
                </p>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="admin-id"
                  className="text-sm text-gray-300 font-medium"
                >
                  Admin ID
                </label>
                <Input
                  id="admin-id"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter admin ID"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="admin-pass"
                  className="text-sm text-gray-300 font-medium"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="admin-pass"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    type={showAdminPass ? "text" : "password"}
                    placeholder="Enter password"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {adminError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{adminError}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={adminLoading || !adminId || !adminPass}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all"
              >
                {adminLoading ? "Verifying..." : "Login as Admin"}
              </Button>
            </form>
          ) : (
            <div>
              {/* Login / Register toggle */}
              <div className="flex bg-gray-800 rounded-xl p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setUserMode("login");
                    setLoginError("");
                    setRegError("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    userMode === "login"
                      ? "bg-gray-700 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMode("register");
                    setLoginError("");
                    setRegError("");
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    userMode === "register"
                      ? "bg-gray-700 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <UserPlus size={14} /> Register
                </button>
              </div>

              {userMode === "login" ? (
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Welcome Back
                    </h2>
                    <p className="text-gray-400 text-sm mb-1">
                      Sign in with your username and password
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="login-username"
                      className="text-sm text-gray-300 font-medium"
                    >
                      Username
                    </label>
                    <Input
                      id="login-username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="login-pass"
                      className="text-sm text-gray-300 font-medium"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="login-pass"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        type={showLoginPass ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 pr-10"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass(!showLoginPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showLoginPass ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{loginError}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={loginLoading || !loginUsername || !loginPassword}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all"
                  >
                    {loginLoading ? "Signing in..." : "Login"}
                  </Button>
                  <p className="text-center text-sm text-gray-400">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setUserMode("register")}
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Register here
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleUserRegister} className="space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      Create Account
                    </h2>
                    <p className="text-gray-400 text-sm mb-1">
                      Join ANKITA JOSHI and start earning
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-name"
                      className="text-sm text-gray-300 font-medium"
                    >
                      Full Name
                    </label>
                    <Input
                      id="reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-username"
                      className="text-sm text-gray-300 font-medium"
                    >
                      Username
                    </label>
                    <Input
                      id="reg-username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-bio"
                      className="text-sm text-gray-300 font-medium"
                    >
                      Bio <span className="text-gray-500">(optional)</span>
                    </label>
                    <Input
                      id="reg-bio"
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                      placeholder="Short bio about yourself"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-pass"
                      className="text-sm text-gray-300 font-medium"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="reg-pass"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        type={showRegPass ? "text" : "password"}
                        placeholder="Create a password"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 pr-10"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {regError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{regError}</p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      regLoading || !regUsername || !regPassword || !regName
                    }
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all"
                  >
                    {regLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setUserMode("login")}
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Login here
                    </button>
                  </p>
                </form>
              )}

              <div className="mt-5 p-4 bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  What you can do:
                </h3>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>&bull; Share photos, videos and reels</li>
                  <li>&bull; Connect with friends</li>
                  <li>&bull; Earn money from views (&#8377;10/1000 views)</li>
                  <li>&bull; Withdraw earnings to UPI/Bank</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
