import React from "react";

// Flag of Somalia: light blue field with a white five-pointed star (3:2).
export default function SomaliaFlag({ className = "h-5 w-auto" }) {
  return (
    <svg viewBox="0 0 1280 853" role="img" aria-label="Flag of Somalia" className={`rounded-[2px] shadow-sm ring-1 ring-black/10 ${className}`}>
      <rect width="1280" height="853" fill="#4189dd" />
      <polygon
        fill="#fff"
        points="640,221 685,363 835,363 714,450 760,592 640,505 519,592 565,450 445,363 594,363"
      />
    </svg>
  );
}
