import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "./mock-data";

interface User {
  id: string;
  name: string;
  designation: string;
  role: UserRole;
  district?: string;
  division?: string;
  department?: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  loginWithEmail: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const MOCK_USERS: Record<UserRole, User> = {
  guardian_secretary: {
    id: "gs-001",
    name: "Shri. O P Gupta, IAS",
    designation: "Additional Chief Secretary, Finance",
    role: "guardian_secretary",
    district: "Pune",
    email: "acs.finance@maharashtra.gov.in",
  },
  department_secretary: {
    id: "ds-001",
    name: "Shri. Milind Mhaiskar, IAS",
    designation: "Additional Chief Secretary, Public Works Department",
    role: "department_secretary",
    department: "Public Works Department (PWD)",
    email: "acs.pwd@maharashtra.gov.in",
  },
  district_collector: {
    id: "dc-001",
    name: "Shri. Jitendra Dudi, IAS",
    designation: "District Collector, Pune",
    role: "district_collector",
    district: "Pune",
    email: "collector.pune@maharashtra.gov.in",
  },
  divisional_commissioner: {
    id: "divc-001",
    name: "Dr. Vijay Namdeo Suryawanshi, IAS",
    designation: "Divisional Commissioner, Konkan Division",
    role: "divisional_commissioner",
    division: "Konkan",
    email: "divcom.konkan@maharashtra.gov.in",
  },
  chief_secretary: {
    id: "cs-001",
    name: "Shri. Rajesh Aggarwal, IAS",
    designation: "Chief Secretary, Government of Maharashtra",
    role: "chief_secretary",
    email: "cs@maharashtra.gov.in",
  },
  cmo: {
    id: "cmo-001",
    name: "CMO Team",
    designation: "Chief Minister's Office",
    role: "cmo",
    email: "cmo@maharashtra.gov.in",
  },
  system_admin: {
    id: "admin-001",
    name: "CS Office Team",
    designation: "Chief Secretary's Office",
    role: "system_admin",
    email: "cs.office@maharashtra.gov.in",
  },
};

// Authorized CS Office users with credentials
export const CS_OFFICE_USERS: { name: string; email: string; password: string; id: string }[] = [
  { id: "cso-001", name: "Pratik Bavi", email: "bavipratik@gmail.com", password: "cso@2026" },
  { id: "cso-002", name: "Rishikesh Shirke", email: "rishishirke65@gmail.com", password: "cso@2026" },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
  };

  const loginWithEmail = (email: string, password: string): { success: boolean; error?: string } => {
    const found = CS_OFFICE_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, error: "Invalid email or password" };
    }
    setUser({
      id: found.id,
      name: found.name,
      designation: "Chief Secretary's Office",
      role: "system_admin",
      email: found.email,
    });
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithEmail, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
