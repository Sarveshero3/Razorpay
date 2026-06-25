import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!email.endsWith("@org.com")) {
      // Why: Spec explicitly requires client-side checks for @org.com domain validation
      tempErrors.email = "Access restricted: Only @org.com emails are authorized";
    }
    if (!password) {
      tempErrors.password = "Password is required";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Security clearance verified. Session established.");
      navigate("/");
    } catch (err: any) {
      // Why: Display structured error message rather than unformatted browser alerts
      toast.error(err.message || "Invalid credentials entered");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-obsidian-card border border-carbon-border p-8 shadow-flat">
        
        {/* Header styling */}
        <div className="border-b border-carbon-border pb-6 mb-6">
          <div className="flex items-center space-x-2 mb-2 font-mono">
            <span className="w-2 h-2 bg-brand-cyan rounded-full animate-ping" />
            <span className="text-xs text-brand-cyan tracking-[0.25em] uppercase font-bold">SECURE PORTAL LOGIN</span>
          </div>
          <p className="text-[11px] text-carbon-light">Input organization credentials to start session node.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
              Corporate Email [email@org.com]
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-carbon-input border ${
                errors.email ? "border-brand-rose focus:border-brand-rose" : "border-carbon-border focus:border-brand-cyan"
              } px-3 py-2 text-sm text-slate-100 font-mono outline-none transition-all rounded-sm`}
              placeholder="user@org.com"
            />
            {errors.email && (
              <p className="text-[10px] text-brand-rose font-mono">▲ {errors.email}</p>
            )}
          </div>

          {/* Password input field */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-carbon-input border ${
                errors.password ? "border-brand-rose focus:border-brand-rose" : "border-carbon-border focus:border-brand-cyan"
              } px-3 py-2 text-sm text-slate-100 font-mono outline-none transition-all rounded-sm`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-[10px] text-brand-rose font-mono">▲ {errors.password}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-brand-cyan hover:bg-brand-cyan/95 disabled:bg-carbon-border disabled:text-carbon-light text-obsidian px-4 py-2.5 text-xs font-bold font-mono tracking-widest rounded-sm shadow-flat hover:shadow-flatAccent transition-all"
          >
            {loading ? "INITIALIZING SECURE LINK..." : "ESTABLISH SESSION"}
          </button>
        </form>

        {/* Navigation fallback */}
        <div className="mt-6 border-t border-carbon-border pt-6 text-center font-mono text-[10px] text-carbon-light">
          <span>New staff member? </span>
          <Link to="/register" className="text-brand-cyan hover:underline">
            Register node
          </Link>
        </div>
      </div>
    </div>
  );
};
