import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../services/api";
import { toast } from "../../components/Toast";
import { TableSkeleton } from "../../components/Skeleton";
import { ShieldCheck, GitMerge, Check, UserCheck, Plus, Trash2 } from "lucide-react";

interface Reimbursement {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  employeeId: string;
}

interface DirectoryUser {
  userId: string;
  name: string;
  email: string;
  role: "EMP" | "RM" | "APE" | "CFO";
}

interface Assignment {
  empId: string;
  rmId: string;
}

export const CfoDashboard: React.FC = () => {
  const location = useLocation();
  const getInitialTab = () => {
    if (location.pathname === "/org-structure") return "org";
    if (location.pathname === "/directory") return "roles";
    return "claims";
  };
  const [activeTab, setActiveTab] = useState<"claims" | "roles" | "org">(getInitialTab());

  useEffect(() => {
    if (location.pathname === "/org-structure") {
      setActiveTab("org");
    } else if (location.pathname === "/directory") {
      setActiveTab("roles");
    } else if (location.pathname === "/final-approvals") {
      setActiveTab("claims");
    }
  }, [location.pathname]);
  const [claims, setClaims] = useState<Reimbursement[]>([]);
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Form states for RM assignment
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedRm, setSelectedRm] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res: any = await api.get("/rest/reimbursements");
      // Backend filters for CFO: apeApproved=true, status not REJECTED
      setClaims(res.data.reimbursements);
    } catch (err: any) {
      toast.error(err.message || "Failed to load CFO final approvals");
    } finally {
      setLoadingClaims(false);
    }
  };

  const fetchDirectory = async () => {
    try {
      setLoadingDirectory(true);
      const res: any = await api.get("/rest/employees");
      // Backend filters for CFO: returns { users, assignments }
      setUsers(res.data.users || []);
      setAssignments(res.data.assignments || []);
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
    if (activeTab === "roles" || activeTab === "org") {
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
      toast.success("Claim finalized. Status remains APPROVED.");
      // CFO approvals are idempotent/terminal, just fetch update
      fetchClaims();
    } catch (err: any) {
      toast.error(err.message || "Failed to process approval");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    setActionId(claimId);
    try {
      await api.patch("/rest/reimbursements", {
        userId: claimId,
        status: "REJECTED",
      });
      toast.success("Claim rejected. Terminal state registered.");
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: any) {
      toast.error(err.message || "Failed to process rejection");
    } finally {
      setActionId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.post("/rest/roles/assign", {
        userId,
        role: newRole,
      });
      toast.success("Role updated successfully.");
      // Refresh directory
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign role");
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedRm) return;

    setAssigning(true);
    try {
      await api.post("/rest/employees/assign", {
        empUserId: selectedEmp,
        rmUserId: selectedRm,
      });
      toast.success("Employee assigned to Reporting Manager.");
      setSelectedEmp("");
      setSelectedRm("");
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || "Failed to map assignment");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignEmployee = async (empUserId: string, rmUserId: string) => {
    try {
      await api.delete("/rest/employees/assign", {
        empUserId,
        rmUserId,
      });
      toast.success("Employee reporting assignment removed.");
      fetchDirectory();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove assignment");
    }
  };

  // Derive RMs and subordinates for visual layout
  const managers = users.filter((u) => u.role === "RM");
  const employees = users.filter((u) => u.role === "EMP");
  const assignedEmpIds = assignments.map((a) => a.empId);
  const unassignedEmployees = employees.filter((e) => !assignedEmpIds.includes(e.userId));

  const getUserLabel = (userId: string) => {
    const found = users.find((u) => u.userId === userId);
    return found ? found.name : "Employee Node";
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-carbon-border pb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-display">CFO Administration Terminal</h2>
          <p className="text-xs text-carbon-light mt-1">Audit final expense lists, assign security roles, and map reporting hierarchies.</p>
        </div>

        {/* Navigation tabs */}
        <div className="flex bg-obsidian border border-carbon-border p-1 rounded-sm font-mono text-xs">
          <button
            onClick={() => setActiveTab("claims")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "claims" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FINAL APPROVALS ({claims.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "roles" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ASSIGN ROLES</span>
          </button>
          <button
            onClick={() => setActiveTab("org")}
            className={`flex items-center space-x-2 px-3 py-1.5 transition-all ${
              activeTab === "org" ? "bg-brand-cyan/10 text-brand-cyan" : "text-carbon-light hover:text-slate-200"
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>ORG STRUCTURE</span>
          </button>
        </div>
      </div>

      {activeTab === "claims" ? (
        /* FINAL APPROVALS SEGMENT */
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
                No APE-approved expense disbursements require final CFO audit.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  <th className="p-4">Claim Details</th>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4 text-right">Value (USD)</th>
                  <th className="p-4 text-center">APE State</th>
                  <th className="p-4 text-center">CFO Action</th>
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
                      [DISBURSED]
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
                          onClick={() => handleReject(c.id)}
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
      ) : activeTab === "roles" ? (
        /* ROLE MANAGEMENT SEGMENT */
        loadingDirectory ? (
          <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
            <TableSkeleton />
          </div>
        ) : (
          <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  <th className="p-4">User ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Security Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-border/50 text-xs font-mono">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-obsidian-hover/40 transition-colors">
                    <td className="p-4 text-brand-cyan text-[11px] font-bold">{u.userId}</td>
                    <td className="p-4 text-slate-200 font-sans font-bold">{u.name}</td>
                    <td className="p-4 text-carbon-light">{u.email}</td>
                    <td className="p-4 text-center">
                      {/* Select Dropdown for Instant Role Reassignment */}
                      {u.email === "cfo@org.com" ? (
                        <span className="inline-block border border-brand-cyan/20 text-brand-cyan bg-brand-cyan/5 px-2 py-1 text-[10px] font-bold rounded-sm">
                          SYSTEM ROOT [CFO]
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                          className="bg-carbon-input border border-carbon-border text-slate-200 px-3 py-1 font-mono text-xs focus:border-brand-cyan outline-none rounded-sm transition-all"
                        >
                          <option value="EMP">EMP (Employee)</option>
                          <option value="RM">RM (Manager)</option>
                          <option value="APE">APE (Payable)</option>
                          <option value="CFO">CFO (Officer)</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ORG STRUCTURE SEGMENT */
        loadingDirectory ? (
          <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
            <TableSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* RM Cards and Subordinate list (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-mono text-[10px] text-carbon-light tracking-wider uppercase border-b border-carbon-border pb-2">
                REPORTING STRUCTURE MAP
              </h3>

              {managers.length === 0 ? (
                <div className="bg-obsidian-card border border-carbon-border p-6 text-center font-mono text-xs text-carbon-light">
                  No Reporting Managers registered. Assign user roles first.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {managers.map((m) => {
                    // Find employees assigned to this manager
                    const subordinateIds = assignments.filter((a) => a.rmId === m.userId).map((a) => a.empId);
                    const directReports = employees.filter((e) => subordinateIds.includes(e.userId));

                    return (
                      <div key={m.userId} className="bg-obsidian-card border border-carbon-border p-5 shadow-flat space-y-4">
                        {/* Manager info */}
                        <div className="border-b border-carbon-border pb-3">
                          <h4 className="text-sm font-bold text-slate-200 font-display truncate">{m.name}</h4>
                          <span className="font-mono text-[9px] text-carbon-light block truncate">{m.email}</span>
                          <span className="inline-block mt-1 font-mono text-[8px] bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                            MANAGER NODE
                          </span>
                        </div>

                        {/* Subordinates list */}
                        <div className="space-y-2">
                          <h5 className="font-mono text-[9px] text-carbon-light uppercase tracking-wider">
                            Direct Reports ({directReports.length})
                          </h5>
                          {directReports.length === 0 ? (
                            <p className="text-[10px] text-carbon-light italic font-mono bg-obsidian/30 p-2 rounded-sm border border-carbon-border/40">
                              No reports mapped to node
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {directReports.map((e) => (
                                <div
                                  key={e.userId}
                                  className="flex items-center justify-between bg-obsidian/50 p-2 border border-carbon-border/60 hover:border-slate-700/80 transition-colors rounded-sm"
                                >
                                  <div className="truncate pr-2 font-mono text-[11px]">
                                    <span className="font-sans font-bold text-slate-200 block truncate">{e.name}</span>
                                    <span className="text-[9px] text-carbon-light/65 truncate block">{e.email}</span>
                                  </div>
                                  <button
                                    onClick={() => handleUnassignEmployee(e.userId, m.userId)}
                                    className="p-1 border border-brand-rose/20 text-brand-rose hover:bg-brand-rose/5 rounded-sm hover:border-brand-rose transition-all shrink-0"
                                    title="Remove assignment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assignment form sidebar (1/3 width) */}
            <div className="space-y-6">
              {/* ASSIGNMENT FORM */}
              <div>
                <h3 className="font-mono text-[10px] text-carbon-light tracking-wider uppercase border-b border-carbon-border pb-2 mb-4">
                  MAP NEW REPORTING NODE
                </h3>
                
                <form onSubmit={handleAssignEmployee} className="bg-obsidian-card border border-carbon-border p-5 shadow-flat space-y-4">
                  {/* Select Employee */}
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                      Select Employee (EMP)
                    </label>
                    <select
                      value={selectedEmp}
                      onChange={(e) => setSelectedEmp(e.target.value)}
                      className="w-full bg-carbon-input border border-carbon-border text-slate-200 px-3 py-2 font-mono text-xs focus:border-brand-cyan outline-none rounded-sm transition-all"
                    >
                      <option value="">-- CHOOSE UNASSIGNED STAFF --</option>
                      {unassignedEmployees.map((e) => (
                        <option key={e.userId} value={e.userId}>
                          {e.name} ({e.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select RM */}
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                      Select Reporting Manager (RM)
                    </label>
                    <select
                      value={selectedRm}
                      onChange={(e) => setSelectedRm(e.target.value)}
                      className="w-full bg-carbon-input border border-carbon-border text-slate-200 px-3 py-2 font-mono text-xs focus:border-brand-cyan outline-none rounded-sm transition-all"
                    >
                      <option value="">-- CHOOSE MANAGER NODE --</option>
                      {managers.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={assigning || !selectedEmp || !selectedRm}
                    className="w-full bg-brand-cyan hover:bg-brand-cyan/95 disabled:bg-carbon-border disabled:text-carbon-light text-obsidian px-4 py-2.5 text-xs font-bold font-mono tracking-widest rounded-sm shadow-flat transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ESTABLISH ASSIGNMENT</span>
                  </button>
                </form>
              </div>

              {/* UNASSIGNED LIST */}
              <div>
                <h3 className="font-mono text-[10px] text-carbon-light tracking-wider uppercase border-b border-carbon-border pb-2 mb-4">
                  UNASSIGNED EMPLOYEES ({unassignedEmployees.length})
                </h3>

                {unassignedEmployees.length === 0 ? (
                  <div className="bg-obsidian-card border border-carbon-border p-4 text-center font-mono text-[10px] text-carbon-light">
                    All employees are mapped.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {unassignedEmployees.map((e) => (
                      <div
                        key={e.userId}
                        className="bg-obsidian-card border border-carbon-border p-3 flex flex-col space-y-1 font-mono text-[11px]"
                      >
                        <span className="font-sans font-bold text-slate-200 block truncate">{e.name}</span>
                        <span className="text-[10px] text-carbon-light block truncate">{e.email}</span>
                        <span className="text-[9px] text-brand-amber font-bold uppercase tracking-wide">
                          [UNASSIGNED_NODE]
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      )}
    </div>
  );
};
