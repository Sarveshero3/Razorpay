import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { toast } from "../../components/Toast";
import { StatusBadge } from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";
import { Plus, HelpCircle, DollarSign, AlertCircle } from "lucide-react";

interface Reimbursement {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export const MyReimbursements: React.FC = () => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string; amount?: string }>({});

  const fetchReimbursements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await api.get("/rest/reimbursements");
      setReimbursements(res.data.reimbursements);
    } catch (err: any) {
      setError(err.message || "Failed to load reimbursements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const validateForm = () => {
    const tempErrors: typeof formErrors = {};
    if (!title.trim()) tempErrors.title = "Title is required";
    if (!description.trim()) tempErrors.description = "Description is required";
    
    const parsedAmount = parseFloat(amount);
    if (!amount) {
      tempErrors.amount = "Amount is required";
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      // Why: Validate that amount is positive as required by Zod on backend
      tempErrors.amount = "Amount must be a positive number";
    }

    setFormErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const parsedAmount = parseFloat(amount);
    
    // Create optimistic record
    const optimisticRecord: Reimbursement = {
      id: `temp-${Date.now()}`,
      title,
      description,
      amount: parsedAmount,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    try {
      // Optimistic Update
      // Why: Renders list items instantly for seamless UI response times
      setReimbursements((prev) => [optimisticRecord, ...prev]);
      setIsOpen(false);

      const res: any = await api.post("/rest/reimbursements", {
        title,
        description,
        amount: parsedAmount,
      });

      toast.success("Reimbursement claim raised successfully.");
      
      // Replace optimistic record with actual database response
      setReimbursements((prev) =>
        prev.map((item) => (item.id === optimisticRecord.id ? res.data.reimbursement : item))
      );
      
      // Reset form
      setTitle("");
      setDescription("");
      setAmount("");
      setFormErrors({});
    } catch (err: any) {
      toast.error(err.message || "Failed to submit reimbursement");
      // Rollback optimistic update
      setReimbursements((prev) => prev.filter((item) => item.id !== optimisticRecord.id));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-carbon-border pb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight font-display">My Reimbursements</h2>
          <p className="text-xs text-carbon-light mt-1">Raise and monitor your operational expenses.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center space-x-2 border-2 border-brand-cyan bg-brand-cyan/5 hover:bg-brand-cyan/15 text-brand-cyan px-4 py-2 text-xs font-bold font-mono tracking-widest rounded-sm transition-all shadow-flat hover:shadow-flatAccent self-start"
        >
          <Plus className="w-4 h-4" />
          <span>NEW CLAIM</span>
        </button>
      </div>

      {/* Main List display */}
      {loading && reimbursements.length === 0 ? (
        <div className="bg-obsidian-card border border-carbon-border p-6 shadow-flat">
          <TableSkeleton />
        </div>
      ) : error ? (
        <div className="bg-obsidian-card border-2 border-brand-rose p-6 shadow-flatRose flex items-center space-x-4">
          <AlertCircle className="w-8 h-8 text-brand-rose shrink-0" />
          <div className="font-mono text-xs">
            <h4 className="text-brand-rose font-bold uppercase mb-1">Error Loading Claims</h4>
            <p className="text-carbon-light mb-3">{error}</p>
            <button
              onClick={fetchReimbursements}
              className="px-3 py-1 border border-brand-rose text-brand-rose hover:bg-brand-rose/10 font-bold"
            >
              RETRY FETCH
            </button>
          </div>
        </div>
      ) : reimbursements.length === 0 ? (
        <div className="bg-obsidian-card border border-carbon-border border-dashed p-12 text-center shadow-flat flex flex-col items-center justify-center space-y-4">
          <HelpCircle className="w-10 h-10 text-carbon-light" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-display">No Expense Claims Registered</h4>
            <p className="text-xs text-carbon-light max-w-sm">
              Your expense history registry is currently empty. Raise a new reimbursement claim using the button above to begin.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-obsidian-card border border-carbon-border shadow-flat overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-carbon-border bg-obsidian/40 font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                <th className="p-4 w-1/4">Date Raised</th>
                <th className="p-4 w-1/3">Claim Details</th>
                <th className="p-4 w-1/6 text-right">Amount</th>
                <th className="p-4 w-1/4 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-border/50 text-xs">
              {reimbursements.map((r) => (
                <tr key={r.id} className="hover:bg-obsidian-hover/40 transition-colors">
                  <td className="p-4 font-mono text-carbon-light text-[11px]">
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="font-bold text-slate-200">{r.title}</div>
                    <div className="text-carbon-light font-sans leading-relaxed">{r.description}</div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-100 text-sm">
                    ${r.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raise claim slide drawer modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-obsidian-card border-2 border-brand-cyan p-8 shadow-flatAccent space-y-6">
            <div className="border-b border-carbon-border pb-4 flex items-center justify-between">
              <div className="font-mono flex items-center space-x-2">
                <span className="w-2 h-2 bg-brand-cyan rounded-full animate-ping" />
                <span className="text-xs font-bold text-brand-cyan tracking-widest uppercase">RAISE NEW EXPENSE CLAIM</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-carbon-light hover:text-slate-100 font-mono text-xs"
              >
                [CLOSE]
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  Claim Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full bg-carbon-input border ${
                    formErrors.title ? "border-brand-rose" : "border-carbon-border focus:border-brand-cyan"
                  } px-3 py-2 text-sm text-slate-100 font-sans outline-none transition-all rounded-sm`}
                  placeholder="e.g. Server hosting fees"
                />
                {formErrors.title && (
                  <p className="text-[10px] text-brand-rose font-mono">▲ {formErrors.title}</p>
                )}
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  Description / Business Rationale
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`w-full bg-carbon-input border ${
                    formErrors.description ? "border-brand-rose" : "border-carbon-border focus:border-brand-cyan"
                  } px-3 py-2 text-sm text-slate-100 font-sans outline-none transition-all rounded-sm resize-none`}
                  placeholder="Describe context of expense"
                />
                {formErrors.description && (
                  <p className="text-[10px] text-brand-rose font-mono">▲ {formErrors.description}</p>
                )}
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] text-carbon-light tracking-wider uppercase">
                  Claim Value (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-xs text-carbon-light">$</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full bg-carbon-input border ${
                      formErrors.amount ? "border-brand-rose" : "border-carbon-border focus:border-brand-cyan"
                    } pl-7 pr-3 py-2 text-sm text-slate-100 font-mono outline-none transition-all rounded-sm`}
                    placeholder="0.00"
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-[10px] text-brand-rose font-mono">▲ {formErrors.amount}</p>
                )}
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-cyan hover:bg-brand-cyan/95 disabled:bg-carbon-border disabled:text-carbon-light text-obsidian px-4 py-2.5 text-xs font-bold font-mono tracking-widest rounded-sm shadow-flat transition-all"
                >
                  {submitting ? "RECORDING SYSTEM NODE..." : "SUBMIT CLAIM"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="border border-carbon-border bg-obsidian hover:bg-obsidian-hover px-4 py-2.5 text-xs font-bold font-mono tracking-widest rounded-sm transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
