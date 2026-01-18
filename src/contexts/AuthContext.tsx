import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export type UserRole = 'teacher' | 'principal' | 'manager' | 'admin';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  can_review_achievements?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token to requests
if (localStorage.getItem("token")) {
  api.defaults.headers.common["Authorization"] =
    `Bearer ${localStorage.getItem("token")}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load saved user when app reloads
  useEffect(() => {
    const token = localStorage.getItem("token");

    // If staff token exists, clear any student session
    if (token) {
      localStorage.removeItem("student_token");
      localStorage.removeItem("student");
    }

    if (!token) return;

    api.get("/me")
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing student session
      localStorage.removeItem("student_token");
      localStorage.removeItem("student");

      const res = await api.post("/login", { email, password });

      const token = res.data.token;
      const userData = res.data.user;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(userData);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("student_token"); // Also clear student session
    localStorage.removeItem("student");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
