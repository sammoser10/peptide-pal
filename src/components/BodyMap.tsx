"use client";

export interface InjectionSiteInfo {
  site: string;
  lastUsed?: string; // ISO date
  count?: number; // times used in recent history
}

interface Props {
  selected: string;
  onSelect: (site: string) => void;
  recentSites?: InjectionSiteInfo[];
  recommendedSite?: string;
  availableSites?: string[];
}

const ALL_INJECTION_SITES = [
  { id: "Left deltoid", label: "L Deltoid", group: "Upper" },
  { id: "Right deltoid", label: "R Deltoid", group: "Upper" },
  { id: "Left abdomen", label: "L Abdomen", group: "Core" },
  { id: "Right abdomen", label: "R Abdomen", group: "Core" },
  { id: "Left love handle", label: "L Love Handle", group: "Core" },
  { id: "Right love handle", label: "R Love Handle", group: "Core" },
  { id: "Left thigh", label: "L Thigh", group: "Lower" },
  { id: "Right thigh", label: "R Thigh", group: "Lower" },
  { id: "Left glute", label: "L Glute", group: "Lower" },
  { id: "Right glute", label: "R Glute", group: "Lower" },
];

export { ALL_INJECTION_SITES };

function formatLastUsed(dateStr: string): string {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function BodyMap({
  selected,
  onSelect,
  recentSites = [],
  recommendedSite,
  availableSites,
}: Props) {
  const recentMap = new Map(recentSites.map((s) => [s.site, s]));

  const sites = availableSites
    ? ALL_INJECTION_SITES.filter((s) => availableSites.includes(s.id))
    : ALL_INJECTION_SITES;

  const groups = ["Upper", "Core", "Lower"];
  const grouped = groups
    .map((g) => ({
      label: g,
      sites: sites.filter((s) => s.group === g),
    }))
    .filter((g) => g.sites.length > 0);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Injection Site</label>

      {recommendedSite && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-full bg-success/8 border border-success/15">
          <span className="w-2 h-2 rounded-full bg-success shrink-0" />
          <span className="text-[12px] text-success font-medium">
            Recommended: <span className="font-semibold">{recommendedSite}</span>
          </span>
        </div>
      )}

      <div className="space-y-3">
        {grouped.map((group) => (
          <div key={group.label}>
            <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5 px-1">
              {group.label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.sites.map((site) => {
                const isSelected = selected === site.id;
                const isRecommended = recommendedSite === site.id;
                const recent = recentMap.get(site.id);

                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => onSelect(site.id)}
                    className={`relative px-3.5 py-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                        : isRecommended
                          ? "bg-success/8 border border-success/20"
                          : "bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div className={`font-semibold text-[13px] ${isSelected ? "text-white" : ""}`}>
                      {site.label}
                    </div>
                    {recent?.lastUsed && (
                      <div className={`text-[11px] mt-0.5 ${isSelected ? "text-white/60" : "text-muted"}`}>
                        {formatLastUsed(recent.lastUsed)}
                        {recent.count && recent.count > 1 ? ` · ${recent.count}x` : ""}
                      </div>
                    )}
                    {isRecommended && !isSelected && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-success" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-3 text-[13px] font-medium text-primary text-center">
          {selected}
        </div>
      )}
    </div>
  );
}
