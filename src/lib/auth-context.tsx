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
  logout: () => void;
  isAuthenticated: boolean;
}

const MOCK_USERS: Record<UserRole, User> = {
  guardian_secretary: {
    id: "gs-001",
    name: "Shri. A. K. Verma, IAS",
    designation: "Principal Secretary, Finance",
    role: "guardian_secretary",
    district: "Pune",
    email: "ak.verma@maharashtra.gov.in",
  },
  department_secretary: {
    id: "ds-001",
    name: "Shri. M. P. Deshmukh, IAS",
    designation: "Secretary, Public Works Department",
    role: "department_secretary",
    department: "Public Works Department (PWD)",
    email: "mp.deshmukh@maharashtra.gov.in",
  },
  district_collector: {
    id: "dc-001",
    name: "Dr. S. N. Kulkarni, IAS",
    designation: "District Collector, Pune",
    role: "district_collector",
    district: "Pune",
    email: "collector.pune@maharashtra.gov.in",
  },
  divisional_commissioner: {
    id: "divc-001",
    name: "Smt. P. L. Desai, IAS",
    designation: "Divisional Commissioner, Pune Division",
    role: "divisional_commissioner",
    division: "Pune",
    email: "divcomm.pune@maharashtra.gov.in",
  },
  chief_secretary: {
    id: "cs-001",
    name: "Shri. R. S. Sharma, IAS",
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
    name: "System Administrator",
    designation: "IT/NIC Team",
    role: "system_admin",
    email: "admin@maharashtra.gov.in",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
