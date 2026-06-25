import React from "react";

interface StatusBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs = {
    PENDING: {
      style: "text-brand-amber border-brand-amber/30 bg-brand-amber/5",
      indicator: "bg-brand-amber",
    },
    APPROVED: {
      style: "text-brand-green border-brand-green/30 bg-brand-green/5",
      indicator: "bg-brand-green",
    },
    REJECTED: {
      style: "text-brand-rose border-brand-rose/30 bg-brand-rose/5",
      indicator: "bg-brand-rose",
    },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <span
      className={`inline-flex items-center space-x-2 border px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase rounded-sm ${config.style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.indicator}`} />
      <span>{status}</span>
    </span>
  );
};
