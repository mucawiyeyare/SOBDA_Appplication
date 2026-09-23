import React from "react";

// Small red-dash label used above section titles, as in the SOBDA mockups.
function Eyebrow({ children, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 text-sm font-semibold text-navy ${className}`}>
      <span className="h-0.5 w-7 rounded bg-brand" />
      {children}
    </div>
  );
}

export default Eyebrow;
