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
    <div
      role="tablist"
      aria-label="Legal Clarity features"
      className="flex flex-wrap gap-x-1 -mb-px relative z-10"
    >
      {tabs.map((t, idx) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${t.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={`focus-ring text-sm font-medium px-4 py-2.5 rounded-t-md border border-b-0 transition-colors ${
              isActive
                ? "bg-paper text-ink border-ink/20 relative"
                : "bg-ink/5 text-ink/55 border-transparent hover:text-ink/80 hover:bg-ink/10 translate-y-[3px]"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
