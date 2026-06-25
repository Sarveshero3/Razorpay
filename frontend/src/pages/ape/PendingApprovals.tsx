import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../services/api";
import { toast } from "../../components/Toast";
import { TableSkeleton } from "../../components/Skeleton";
import { Check, ShieldAlert, Users, FolderCheck } from "lucide-react";

interface Reimbursement {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  employeeId: string;
  rmApproved: boolean;
}

interface DirectoryUser {
  userId: string;
  name: string;
  email: string;
  role: "EMP" | "RM";
}

export const PendingApprovals: React.FC = () => {
  const location = useLocation();
  const getInitialTab = () => {
    if (location.pathname === "/directory") return "directory";
    return "claims";
  };
  const [activeTab, setActiveTab] = useState<"claims" | "directory">(getInitialTab());

  useEffect(() => {
    if (location.pathname === "/directory") {
      setActiveTab("directory");
    } else if (location.pathname === "/pending-approvals") {
      setActiveTab("claims");
    }
  }, [location.pathname]);
  const [claims, setClaims] = useState<Reimbursement[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  
  // Reject confirmation state
  const [rejectingClaim, setRejectingClaim] = useState<Reimbursement | null>(null);

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res: any = await api.get("/rest/reimbursements");
      // Backend filters for APE: rmApproved=true, apeApproved=false, status PENDING
      setClaims(res.data.reimbursements);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch pending APE approvals");
    } finally {
      setLoadingClaims(false);
    }
  };

  const fetchDirectory = async () => {
    try {
      setLoadingDirectory(true);
      const res: any = await api.get("/rest/employees");
      // Backend filters for APE: all EMPs and RMs
      setDirectory(res.data.users);
    } catch (err: any) {
      toast.error(err.message || "Failed to load directory");
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    if (activeTab === "directory") {
      fetchDirectory();
    }
  }, [activeTab]);

  const handleApprove = async (claimId: string) => {
    setActionId(claimId);
    try {
      await api.patch("/rest/reimbursements", {
        userId: claimId,
        status: "APPROVED",
      });
      toast.success("Claim fully approved. Status updated to APPROVED.");
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
      toast.success("Claim rejected. Terminal state registered.");
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject claim");
    } finally {
      setActionId(null);
    }
  };

  const getUserLabel = (userId: string) => {
    const found = directory.find((d) => d.userId === userId);
    return found ? found.name : "Employee Node";
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-carbon-border pb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-display">Accounts Payable Console</h2>
          <p className="text-xs text-carbon-light mt-1">Review manager-approved claims and process corporate disbursements.</p>
        </div>

        {/* Tab navigations */}
        <div className="flex bg-obsidian border border-carbon-border p-1 rounded-sm font-mono text-xs">
          <button
            onClick={() => setActiveTab("claims")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "claims" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <FolderCheck className="w-3.5 h-3.5" />
            <span>PENDING APE APPROVALS ({claims.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "directory" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>STAFF DIRECTORY</span>
          </button>
        </div>
      </div>

      {activeTab === "claims" ? (
        /* PENDING CLAIMS REVIEW */
        loadingClaims ? (
          <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
            <TableSkeleton />
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-obsidian-card border border-carbon-border border-dashed p-12 text-center shadow-flat flex flex-col items-center justify-center space-y-4">
            <Check className="w-8 h-8 text-brand-green border-2 border-brand-green/30 p-1.5 rounded-full" />
            <div>
              <h4 className="text-sm font-bold font-display uppercase tracking-wider text-brand-green">INBOX VACANT</h4>
              <p className="text-xs text-carbon-light max-w-sm mt-1">
                No manager-approved reimbursement claims are currently awaiting Accounts Payable clearance.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  <th className="p-4">Submission Details</th>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4 text-right">Value (USD)</th>
                  <th className="p-4 text-center font-mono">RM State</th>
                  <th className="p-4 text-center">Executive Decisions</th>
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
                      {getUserLabel(c.employeeId)}
                      <div className="text-[9px] text-carbon-light/65 truncate max-w-[150px]">{c.employeeId}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-100 text-sm">
                      ${c.amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-mono text-[10px] text-brand-green font-bold">
                      [APPROVED]
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex space-x-2 font-mono text-[11px]">
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={actionId !== null}
                          className="border border-brand-green/30 hover:border-brand-green bg-brand-green/5 hover:bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-sm shadow-flat transition-all"
                        >
                          DISBURSE
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
        /* STAFF DIRECTORY VIEW */
        loadingDirectory ? (
          <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
            <TableSkeleton />
          </div>
        ) : (
          <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  <th className="p-4">Registry ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4 text-center">Assigned Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-border/50 text-xs font-mono">
                {directory.map((user) => (
                  <tr key={user.userId} className="hover:bg-obsidian-hover/40 transition-colors">
                    <td className="p-4 text-brand-cyan text-[11px] font-bold">{user.userId}</td>
                    <td className="p-4 text-slate-200 font-sans font-bold">{user.name}</td>
                    <td className="p-4 text-carbon-light">{user.email}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-sm ${
                        user.role === "RM" 
                          ? "border-brand-cyan/20 text-brand-cyan bg-brand-cyan/5" 
                          : "border-slate-700/50 text-carbon-light bg-slate-800/10"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Reject claim dialog */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-obsidian-card border-2 border-brand-rose p-6 shadow-flatRose space-y-6">
            <div className="flex items-center space-x-3 text-brand-rose">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-mono text-sm font-bold tracking-wider uppercase">CONFIRM DISBURSEMENT REJECTION</h3>
            </div>
            
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              Are you certain you wish to reject the claim <span className="font-bold">"{rejectingClaim.title}"</span> raised by {getUserLabel(rejectingClaim.employeeId)}? 
              <br />
              <span className="text-brand-rose font-bold">This action is terminal and will notify the user of rejection.</span>
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
