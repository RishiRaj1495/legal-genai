"use client";

export interface TabDef {
  id: string;
  label: string;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight") {
      onChange(tabs[(idx + 1) % tabs.length].id);
    } else if (e.key === "ArrowLeft") {
      onChange(tabs[(idx - 1 + tabs.length) % tabs.length].id);
    }
  };

  return (
    <div role="tablist" aria-label="Legal Clarity AI features" className="flex flex-wrap gap-2 mb-6">
      {tabs.map((t, idx) => (
        <button
          key={t.id}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={active === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, idx)}
          className={`focus-ring px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            active === t.id
              ? "bg-ink text-paper border-ink"
              : "bg-white/60 text-ink/70 border-ink/15 hover:border-ink/40"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
