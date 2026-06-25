import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { toast } from "../../components/Toast";
import { TableSkeleton } from "../../components/Skeleton";
import { Check, X, AlertTriangle, Users, FileSpreadsheet, RefreshCw } from "lucide-react";

interface Reimbursement {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  employeeId: string;
}

interface Employee {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export const TeamReimbursements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"claims" | "team">("claims");
  const [claims, setClaims] = useState<Reimbursement[]>([]);
  const [team, setTeam] = useState<Employee[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  
  // Confirm reject modal state
  const [rejectingClaim, setRejectingClaim] = useState<Reimbursement | null>(null);

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res: any = await api.get("/rest/reimbursements");
      // Backend automatically filters to pending subordinate requests for RM role
      setClaims(res.data.reimbursements);
    } catch (err: any) {
      toast.error(err.message || "Failed to load subordinate claims");
    } finally {
      setLoadingClaims(false);
    }
  };

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true);
      const res: any = await api.get("/rest/employees");
      // Backend filters employees to direct subordinates of this RM
      setTeam(res.data.users);
    } catch (err: any) {
      toast.error(err.message || "Failed to load team directory");
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    if (activeTab === "team") {
      fetchTeam();
    }
  }, [activeTab]);

  const handleApprove = async (claimId: string) => {
    setActionId(claimId);
    try {
      await api.patch("/rest/reimbursements", {
        userId: claimId,
        status: "APPROVED",
      });
      toast.success("Claim approved and forwarded to Accounts Payable.");
      // Remove from pending list
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: any) {
      toast.error(err.message || "Failed to approve claim");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingClaim) return;
    const claimId = rejectingClaim.id;
    setActionId(claimId);
    setRejectingClaim(null);

    try {
      await api.patch("/rest/reimbursements", {
        userId: claimId,
        status: "REJECTED",
      });
      toast.success("Claim rejected. Notification recorded.");
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject claim");
    } finally {
      setActionId(null);
    }
  };

  // Find employee name by ID for readability in dashboard tables
  const getEmployeeLabel = (empId: string) => {
    const found = team.find((t) => t.userId === empId);
    return found ? found.name : "Employee Node";
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header console */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-carbon-border pb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-display">Team Management Dashboard</h2>
          <p className="text-xs text-carbon-light mt-1">Review employee claims and audit subordinate directories.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-obsidian border border-carbon-border p-1 rounded-sm font-mono text-xs">
          <button
            onClick={() => setActiveTab("claims")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "claims" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>PENDING CLAIMS ({claims.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "team" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>DIRECT REPORTS</span>
          </button>
        </div>
      </div>

      {activeTab === "claims" ? (
        /* CLAIMS AUDIT SEGMENT */
        loadingClaims ? (
          <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
            <TableSkeleton />
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-obsidian-card border border-carbon-border border-dashed p-12 text-center shadow-flat flex flex-col items-center justify-center space-y-4">
            <Check className="w-8 h-8 text-brand-green border-2 border-brand-green/30 p-1.5 rounded-full" />
            <div>
              <h4 className="text-sm font-bold font-display uppercase tracking-wider text-brand-green">INBOX CLEAR</h4>
              <p className="text-xs text-carbon-light max-w-sm mt-1">
                No pending subordinate reimbursements require your authorization at this time.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  <th className="p-4">Submission ID / Title</th>
                  <th className="p-4">Employee Node</th>
                  <th className="p-4 text-right">Claim Amount</th>
                  <th className="p-4 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-border/50 text-xs">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-obsidian-hover/40 transition-colors">
                    <td className="p-4 space-y-1">
                      <div className="font-bold text-slate-200">{c.title}</div>
                      <div className="text-carbon-light font-sans leading-relaxed">{c.description}</div>
                    </td>
                    <td className="p-4 font-mono text-carbon-light">
                      {getEmployeeLabel(c.employeeId)}
                      <div className="text-[9px] text-carbon-light/60 truncate max-w-[150px]">{c.employeeId}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-100 text-sm">
                      ${c.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex space-x-2 font-mono text-[11px]">
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={actionId !== null}
                          className="border border-brand-green/30 hover:border-brand-green bg-brand-green/5 hover:bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-sm shadow-flat transition-all"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={() => setRejectingClaim(c)}
                          disabled={actionId !== null}
                          className="border border-brand-rose/30 hover:border-brand-rose bg-brand-rose/5 hover:bg-brand-rose/10 text-brand-rose px-2.5 py-1 rounded-sm shadow-flat transition-all"
                        >
                          REJECT
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* TEAM DIRECTORY SEGMENT */
        loadingTeam ? (
          <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
            <TableSkeleton />
          </div>
        ) : team.length === 0 ? (
          <div className="bg-obsidian-card border border-carbon-border border-dashed p-12 text-center shadow-flat flex flex-col items-center justify-center space-y-4">
            <Users className="w-10 h-10 text-carbon-light" />
            <div>
              <h4 className="text-sm font-bold font-display">No Team Assignment Recorded</h4>
              <p className="text-xs text-carbon-light max-w-sm mt-1">
                You are currently not assigned as a manager for any employees. Assignments can be mapped by the CFO.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Corporate Email</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-border/50 text-xs font-mono">
                {team.map((t) => (
                  <tr key={t.userId} className="hover:bg-obsidian-hover/40 transition-colors">
                    <td className="p-4 text-brand-cyan text-[11px] font-bold">{t.userId}</td>
                    <td className="p-4 text-slate-200 font-sans font-bold">{t.name}</td>
                    <td className="p-4 text-carbon-light">{t.email}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-0.5 border border-brand-green/20 text-brand-green bg-brand-green/5 text-[9px] font-bold tracking-wider rounded-sm">
                        ACTIVE_NODE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Confirmation reject dialog overlay */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-obsidian-card border-2 border-brand-rose p-6 shadow-flatRose space-y-6">
            <div className="flex items-center space-x-3 text-brand-rose">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-mono text-sm font-bold tracking-wider uppercase">CONFIRM CLAIM REJECTION</h3>
            </div>
            
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              Are you certain you wish to reject the claim <span className="font-bold">"{rejectingClaim.title}"</span> raised by {getEmployeeLabel(rejectingClaim.employeeId)}? 
              <br />
              <span className="text-brand-rose font-bold">This action is terminal and cannot be undone.</span>
            </p>

            <div className="flex items-center space-x-4 font-mono text-xs">
              <button
                onClick={handleReject}
                className="flex-1 border border-brand-rose bg-brand-rose/10 hover:bg-brand-rose text-brand-rose hover:text-obsidian py-2 font-bold transition-all shadow-flat"
              >
                YES, REJECT CLAIM
              </button>
              <button
                onClick={() => setRejectingClaim(null)}
                className="flex-1 border border-carbon-border bg-obsidian hover:bg-obsidian-hover py-2 font-bold transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
