import React from "react";
import { SOMALIA_REGIONS } from "../utils/somaliaLocations.js";

const cls = "w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500 bg-white";

// Linked dropdowns: region, then district. With `withRoad` a text box for the road / specific area (xafada) follows.
// The value is stored as "District, Region", or "Road, District, Region" when withRoad is on.
export default function RegionDistrictSelect({ value, onChange, required = false, withRoad = false }) {
  // The road is left untrimmed while typing, so spaces between words are kept.
  const parts = (value || "").split(",");
  const region = parts.length > 1 ? parts[parts.length - 1].trim() : "";
  const district = parts.length > 1 ? parts[parts.length - 2].trim() : "";
  const road = withRoad && parts.length > 2 ? parts.slice(0, -2).join(",") : "";
  const knownRegion = SOMALIA_REGIONS[region] ? region : "";
  const knownDistrict = knownRegion && SOMALIA_REGIONS[knownRegion].includes(district) ? district : "";

  const emit = (r, d, rd) => {
    if (!r) return onChange("");
    onChange(withRoad && rd ? `${rd}, ${d}, ${r}` : `${d}, ${r}`);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select value={knownRegion} onChange={(e) => emit(e.target.value, "", "")} className={cls} required={required}>
          <option value="">Select region</option>
          {Object.keys(SOMALIA_REGIONS).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={knownDistrict}
          onChange={(e) => emit(knownRegion, e.target.value, road)}
          disabled={!knownRegion}
          className={`${cls} disabled:opacity-60`}
          required={required}
        >
          <option value="">{knownRegion ? "Select district" : "Choose region first"}</option>
          {(SOMALIA_REGIONS[knownRegion] || []).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      {withRoad && (
        <input
          value={road}
          onChange={(e) => emit(knownRegion, knownDistrict, e.target.value)}
          onBlur={() => road !== road.trim() && emit(knownRegion, knownDistrict, road.trim())}
          disabled={!knownDistrict}
          placeholder="Road / specific area (xafada), e.g. Maka Al-Mukarama Road"
          className={`${cls} disabled:opacity-60`}
        />
      )}
    </div>
  );
}
