import React, { useCallback, useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";
import Dashboard from "./pages/Dashboard";
import { apiRequest, clearToken, getToken } from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signup");
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    apiRequest("/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setMode("login");
  }, []);

  if (checking) return <div className="app-loading"><span className="spinner spinner-dark" /> Loading SiteShelf...</div>;
  if (user) return <Dashboard user={user} onLogout={logout} />;
  return <AuthForm mode={mode} onAuthenticated={setUser} onModeChange={setMode} />;
}
