import React, { useEffect, useState } from "react";

// Older uploads were cut into a circle and saved as a JPEG, which left black corners.
// If all four corners are dark, crop to the largest square inside that circle so the photo shows clean.
function trimDarkCorners(src) {
  return new Promise((resolve) => {
    if (!src.startsWith("data:")) return resolve(src);
    const img = new Image();
    img.onload = () => {
      try {
        const { naturalWidth: w, naturalHeight: h } = img;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dark = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]].every(([x, y]) => {
          const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
          return a < 20 || r + g + b < 60;
        });
        if (!dark) return resolve(src);
        const side = Math.round(Math.min(w, h) * 0.7);
        const o = document.createElement("canvas");
        o.width = side;
        o.height = side;
        o.getContext("2d").drawImage(c, (w - side) / 2, (h - side) / 2, side, side, 0, 0, side, side);
        resolve(o.toDataURL("image/jpeg", 0.9));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// The doctor's uploaded photo, shown as-is in a rectangle (parent sets the size).
export default function DoctorPhoto({ src, alt, className = "" }) {
  const [shown, setShown] = useState(src);
  useEffect(() => {
    let live = true;
    setShown(src);
    trimDarkCorners(src).then((s) => live && setShown(s));
    return () => {
      live = false;
    };
  }, [src]);
  return <img src={shown} alt={alt} className={`object-cover object-top ${className}`} />;
}
