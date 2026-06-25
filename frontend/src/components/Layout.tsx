import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Users, Shield, GitBranch, CreditCard, FileSpreadsheet } from "lucide-react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Compile navigation links dynamically matching the authenticated user's role
  const getNavLinks = () => {
    switch (user.role) {
      case "EMP":
        return [
          { to: "/my-reimbursements", label: "My Reimbursements", icon: CreditCard },
        ];
      case "RM":
        return [
          { to: "/team-reimbursements", label: "Team Approvals", icon: FileSpreadsheet },
          { to: "/my-team", label: "My Team Directory", icon: Users },
        ];
      case "APE":
        return [
          { to: "/pending-approvals", label: "Pending Approvals", icon: Shield },
          { to: "/directory", label: "All Employees", icon: Users },
        ];
      case "CFO":
        return [
          { to: "/final-approvals", label: "Final Approvals", icon: Shield },
          { to: "/directory", label: "All Users Directory", icon: Users },
          { to: "/org-structure", label: "Organization Structure", icon: GitBranch },
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <div className="min-h-screen bg-obsidian flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Sidebar Nav Shell */}
      <aside className="w-full md:w-64 bg-obsidian-card border-b md:border-b-0 md:border-r border-carbon-border flex flex-col justify-between shrink-0 font-mono">
        <div>
          {/* Header branding info */}
          <div className="p-6 border-b border-carbon-border">
            <h1 className="text-xs font-bold text-brand-cyan tracking-[0.2em] flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-ping" />
              <span>REIMBURSE ➔ CTRL</span>
            </h1>
            <div className="mt-1 text-[9px] text-carbon-light tracking-wider">
              STATUS: SECURED_NODE
            </div>
          </div>

          {/* Profile metadata info block */}
          <div className="p-5 border-b border-carbon-border bg-obsidian/30">
            <div className="font-bold text-slate-200 text-xs truncate font-sans">{user.name}</div>
            <div className="text-[10px] text-carbon-light truncate mb-2.5 font-sans">{user.email}</div>
            <span className="inline-block border border-brand-cyan/30 text-brand-cyan bg-brand-cyan/5 px-2 py-0.5 text-[9px] font-bold tracking-widest rounded-sm">
              ROLE: [{user.role}]
            </span>
          </div>

          {/* Render links */}
          <nav className="p-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-3 px-3 py-2 text-xs font-bold tracking-wider rounded-sm transition-all border ${
                    isActive
                      ? "bg-brand-cyan/5 border-brand-cyan/30 text-brand-cyan"
                      : "border-transparent text-carbon-light hover:text-slate-200 hover:bg-obsidian-hover"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Log Out button wrapper */}
        <div className="p-4 border-t border-carbon-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 border border-brand-rose/20 hover:border-brand-rose bg-brand-rose/5 hover:bg-brand-rose/10 text-brand-rose px-3 py-2 text-xs font-bold tracking-widest rounded-sm transition-all shadow-flat hover:shadow-flatRose"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>DISCONNECT</span>
          </button>
        </div>
      </aside>

      {/* Main display screen */}
      <main className="flex-1 p-6 md:p-8 bg-[#08090C] overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
