import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserRole } from "./mock-data";
import { supabase } from "@/integrations/supabase/client";
import {
  AuthUser,
  loginAsOfficer as adapterLoginAs,
} from "./auth-adapter";

type User = AuthUser;

interface AuthContextType {
  user: User | null;
  /** Original (non-impersonated) user, if currently impersonating */
  realUser: User | null;
  /** True when the current session is impersonating another officer */
  viewingAs: boolean;
  /** Set a CSO-authenticated user from edge-function payload. */
  loginWithCSOData: (userData: { id: string; name: string; email: string; designation: string; role: string }) => void;
  /** Set a fully-formed user (used by Parichay SSO and the adapter). */
  setUserFromAdapter: (user: User) => void;
  /** CS Office: impersonate another officer by id. */
  impersonateOfficer: (officerId: string) => Promise<void>;
  /** Return to the real user account after impersonation. */
  stopImpersonating: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const SESSION_KEY = "gs_portal_user";
const REAL_USER_KEY = "gs_portal_real_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ensure the Supabase client has an authenticated session for RLS-protected writes.
// Uses anonymous sign-in so the demo continues to work without real per-user accounts.
async function ensureSupabaseSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await supabase.auth.signInAnonymously();
    }
  } catch (err) {
    console.warn("Anonymous session bootstrap failed:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const [realUser, setRealUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem(REAL_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  // Bootstrap an anonymous Supabase session on mount so RLS-protected
  // INSERT/UPDATE/DELETE operations succeed.
  useEffect(() => {
    ensureSupabaseSession();
  }, []);

  // Persist user to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* sessionStorage unavailable */
    }
  }, [user]);

  useEffect(() => {
    try {
      if (realUser) sessionStorage.setItem(REAL_USER_KEY, JSON.stringify(realUser));
      else sessionStorage.removeItem(REAL_USER_KEY);
    } catch {
      /* sessionStorage unavailable */
    }
  }, [realUser]);

  const login = (role: UserRole) => {
    setUser(adapterMockLogin(role));
  };

  const loginWithCSOData = (userData: { id: string; name: string; email: string; designation: string; role: string }) => {
    setUser({
      id: userData.id,
      name: userData.name,
      designation: userData.designation,
      role: userData.role as UserRole,
      email: userData.email,
      is_cso_admin: true,
    });
  };

  const setUserFromAdapter = (u: User) => setUser(u);

  const impersonateOfficer = async (officerId: string) => {
    if (!user) throw new Error("Not authenticated");
    // Only allow CS Office, system_admin, or chief_secretary to impersonate
    if (!user.is_cso_admin && user.role !== "system_admin" && user.role !== "chief_secretary") {
      throw new Error("Not authorized to impersonate");
    }
    const target = await adapterLoginAs(officerId);
    setRealUser(user);
    setUser(target);
  };

  const stopImpersonating = () => {
    if (realUser) {
      setUser(realUser);
      setRealUser(null);
    }
  };

  const logout = () => {
    setUser(null);
    setRealUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        realUser,
        viewingAs: !!realUser,
        loginWithCSOData,
        setUserFromAdapter,
        impersonateOfficer,
        stopImpersonating,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
