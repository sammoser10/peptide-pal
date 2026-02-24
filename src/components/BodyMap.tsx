"use client";

interface Props {
  selected: string;
  onSelect: (site: string) => void;
}

interface SiteRegion {
  id: string;
  label: string;
  // SVG path or points for the clickable zone
  path: string;
  // Label position
  lx: number;
  ly: number;
}

const SITE_REGIONS: SiteRegion[] = [
  {
    id: "Left deltoid",
    label: "L Delt",
    path: "M56,78 L48,82 L44,100 L48,110 L56,105 Z",
    lx: 34,
    ly: 95,
  },
  {
    id: "Right deltoid",
    label: "R Delt",
    path: "M104,78 L112,82 L116,100 L112,110 L104,105 Z",
    lx: 118,
    ly: 95,
  },
  {
    id: "Left abdomen",
    label: "L Abd",
    path: "M62,125 L62,150 L80,150 L80,125 Z",
    lx: 62,
    ly: 155,
  },
  {
    id: "Right abdomen",
    label: "R Abd",
    path: "M80,125 L80,150 L98,150 L98,125 Z",
    lx: 88,
    ly: 155,
  },
  {
    id: "Left thigh",
    label: "L Thigh",
    path: "M62,168 L60,200 L72,206 L78,200 L78,168 Z",
    lx: 54,
    ly: 198,
  },
  {
    id: "Right thigh",
    label: "R Thigh",
    path: "M82,168 L82,200 L88,206 L100,200 L98,168 Z",
    lx: 98,
    ly: 198,
  },
  {
    id: "Left glute",
    label: "L Glute",
    path: "M62,148 L58,168 L72,174 L78,168 L78,148 Z",
    lx: 54,
    ly: 172,
  },
  {
    id: "Right glute",
    label: "R Glute",
    path: "M82,148 L82,168 L88,174 L102,168 L98,148 Z",
    lx: 98,
    ly: 172,
  },
];

export default function BodyMap({ selected, onSelect }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Injection Site</label>
      <div className="flex flex-col items-center">
        <div className="relative w-full" style={{ maxWidth: 220 }}>
          <svg
            viewBox="0 0 160 280"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body silhouette */}
            <g fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinejoin="round">
              {/* Head */}
              <ellipse cx="80" cy="30" rx="18" ry="22" fill="var(--surface-hover)" />
              {/* Neck */}
              <rect x="73" y="50" width="14" height="12" rx="3" fill="var(--surface-hover)" />
              {/* Torso */}
              <path
                d="M58,62 L56,78 L48,82 L44,100 L48,130 L52,145 L58,168 L60,170 L72,174 L80,176 L88,174 L100,170 L102,168 L108,145 L112,130 L116,100 L112,82 L104,78 L102,62 Z"
                fill="var(--surface-hover)"
              />
              {/* Left arm */}
              <path
                d="M48,82 L40,110 L36,140 L34,160 L38,162 L42,142 L48,115"
                fill="none"
              />
              {/* Right arm */}
              <path
                d="M112,82 L120,110 L124,140 L126,160 L122,162 L118,142 L112,115"
                fill="none"
              />
              {/* Left leg */}
              <path
                d="M60,170 L58,200 L56,235 L54,258 L58,262 L64,240 L68,210 L72,174"
                fill="none"
              />
              {/* Right leg */}
              <path
                d="M100,170 L102,200 L104,235 L106,258 L102,262 L96,240 L92,210 L88,174"
                fill="none"
              />
            </g>

            {/* Center line guide (subtle) */}
            <line
              x1="80" y1="62" x2="80" y2="176"
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="2,4"
              opacity="0.4"
            />

            {/* Clickable site regions */}
            {SITE_REGIONS.map((region) => {
              const isSelected = selected === region.id;
              return (
                <g key={region.id}>
                  <path
                    d={region.path}
                    fill={isSelected ? "var(--primary)" : "var(--primary)"}
                    fillOpacity={isSelected ? 0.35 : 0.08}
                    stroke={isSelected ? "var(--primary)" : "var(--primary)"}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 1 : 0.3}
                    rx="4"
                    className="cursor-pointer transition-all"
                    onClick={() => onSelect(region.id)}
                  />
                  {/* Pulse ring on selected */}
                  {isSelected && (
                    <circle
                      cx={(parseFloat(region.path.match(/M(\d+)/)?.[1] || "0") + parseFloat(region.path.match(/L\d+,\d+\sL(\d+)/)?.[1] || "0")) / 2}
                      cy={(parseFloat(region.path.match(/M\d+,(\d+)/)?.[1] || "0") + parseFloat(region.path.match(/L\d+,(\d+)\sL\d+/)?.[1] || "0")) / 2}
                      r="4"
                      fill="var(--primary)"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="3;7;3"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0.2;0.8"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Side labels */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {SITE_REGIONS.map((region) => {
              const isSelected = selected === region.id;
              const isLeft = region.lx < 80;
              // Compute position as percentage of viewBox
              const xPct = (region.lx / 160) * 100;
              const yPct = (region.ly / 280) * 100;
              return (
                <div
                  key={region.id + "-label"}
                  className={`absolute text-[9px] font-semibold whitespace-nowrap transition-colors pointer-events-auto cursor-pointer ${
                    isSelected ? "text-primary" : "text-muted"
                  }`}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: `translate(${isLeft ? "-100%" : "0%"}, -50%)`,
                  }}
                  onClick={() => onSelect(region.id)}
                >
                  {region.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected site display */}
        <div className={`mt-2 text-sm font-medium text-center transition-colors ${
          selected ? "text-primary" : "text-muted"
        }`}>
          {selected || "Tap a region to select"}
        </div>
      </div>
    </div>
  );
}
