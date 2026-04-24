"use client";

import type { Branch } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";

const BRANCHES: Array<{ key: Branch; label: string; color: string }> = [
  { key: "toledo_espanha", label: "Toledo (ES/MX)", color: "#1d4ed8" },
  { key: "rodovalho", label: "Rodovalho", color: "#15803d" },
  { key: "toledo_pisa", label: "Toledo Pisa", color: "#7e22ce" },
  { key: "toledo_rodovalho", label: "Toledo Rodovalho", color: "#C4703A" },
];

export function BranchFilter() {
  const activeBranches = useFamilyStore((state) => state.activeBranches);
  const toggleBranch = useFamilyStore((state) => state.toggleBranch);

  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtros por ramo">
      {BRANCHES.map((branch) => {
        const active = activeBranches.has(branch.key);

        return (
          <button
            key={branch.key}
            className="inline-flex h-9 items-center gap-2 border border-white/15 px-3 text-sm font-medium text-white transition hover:border-white/35"
            type="button"
            aria-pressed={active}
            style={{
              backgroundColor: branch.color,
              opacity: active ? 1 : 0.4,
            }}
            onClick={() => toggleBranch(branch.key)}
          >
            <span
              className="h-2 w-2 rounded-full bg-white"
              aria-hidden
            />
            {branch.label}
          </button>
        );
      })}
    </div>
  );
}
