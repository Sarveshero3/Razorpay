import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "EMP" | "RM" | "APE" | "CFO";
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and verify session cookie on mount
  useEffect(() => {
    const checkSession = async () => {
      const cached = localStorage.getItem("user_profile");
      if (cached) {
        try {
          const parsedUser = JSON.parse(cached) as User;
          // Verify cookie validity by hitting the base profile-agnostic route
          // Why: If JWT expires or is cleared, this throws 401, clearing state
          await api.get("/rest/reimbursements");
          setUser(parsedUser);
        } catch (err) {
          localStorage.removeItem("user_profile");
          setUser(null);
        }
      }
      setLoading(false);
    };

    // Register global API interceptor callback for session expiration (401)
    // Why: If any background fetch triggers 401, automatically log out user instantly
    api.onUnauthorized(() => {
      localStorage.removeItem("user_profile");
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    });

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response: any = await api.post("/rest/onboardings/login", { email, password });
    const userData = response.data.user;
    setUser(userData);
    localStorage.setItem("user_profile", JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post("/rest/onboardings/register", { name, email, password });
  };

  const logout = async () => {
    try {
      await api.post("/rest/onboardings/logout");
    } catch {
      // Safe fallback: clear client state even if backend clear fails
    } finally {
      setUser(null);
      localStorage.removeItem("user_profile");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
