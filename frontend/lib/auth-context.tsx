"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "./api";

export type UserRole = "guest" | "user" | "admin";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("token");

    if (token) {
      // Verify token is still valid with the backend
      authAPI
        .getProfile()
        .then((data) => {
          // Update user data
          const userData = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
          };
          setUser(userData);
        })
        .catch((error) => {
          // Only logout if it's specifically an invalid token error (401)
          // For other errors, keep the user session intact
          if (
            error.response &&
            error.response.status === 401 &&
            error.response.data.message === "Invalid token"
          ) {
            logout();
          }
          // For all other errors, we keep the user logged in
          console.error("Profile fetch error:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);

      const userData: User = {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      setUser(userData);
      localStorage.setItem("token", data.token);

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await authAPI.register(name, email, password);

      const userData: User = {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      };

      setUser(userData);
      localStorage.setItem("token", data.token);

      toast({
        title: "Registration successful",
        description: `Welcome to Hush Poll, ${name}!`,
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again with different credentials.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAdmin: user?.role === "admin",
        isLoggedIn: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
