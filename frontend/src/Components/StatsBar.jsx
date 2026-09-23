import React from "react";

// Row of icon + number + label tiles inside one rounded card.
function StatsBar({ items, className = "" }) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-line lg:divide-x">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3.5 p-4 sm:p-5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-extrabold leading-none text-navy">{item.value}</p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatsBar;
