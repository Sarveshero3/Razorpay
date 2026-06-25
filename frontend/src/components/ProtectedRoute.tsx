import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TableSkeleton } from "./Skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"EMP" | "RM" | "APE" | "CFO">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-4xl bg-obsidian-card border border-carbon-border p-6 shadow-flat">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-2.5 h-2.5 bg-brand-cyan rounded-full animate-ping" />
            <span className="font-mono text-xs text-carbon-light tracking-widest">CONNECTING TO OPERATIONAL DATABASE...</span>
          </div>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role whitelist is provided and user's role is not allowed
  // Why: Compose access checks cleanly and avoid duplicating checks inline in dashboards
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md bg-obsidian-card border-2 border-brand-rose p-6 shadow-flatRose text-center font-mono">
          <h2 className="text-lg text-brand-rose font-bold mb-4 tracking-wider">▲ AUTH_ERROR: FORBIDDEN</h2>
          <p className="text-xs text-carbon-light mb-6">
            Role [{user.role}] does not possess the permissions necessary to mount this route.
          </p>
          <a
            href="/"
            className="inline-block border border-carbon-border bg-obsidian hover:bg-obsidian-hover px-4 py-2 text-xs text-brand-cyan shadow-flat transition-all"
          >
            RETURN TO ACCESSIBLE AREA
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
