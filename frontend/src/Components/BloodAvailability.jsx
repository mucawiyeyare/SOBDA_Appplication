import React from "react";
import { Droplet } from "lucide-react";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Status is derived from how many registered donors we have in each blood group.
function statusOf(count) {
  if (count === 0) return { label: "Critical", pill: "bg-red-50 text-red-700", dot: "bg-red-500" };
  if (count < 3) return { label: "Low", pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };
  return { label: "Available", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
}

function BloodAvailability({ stats }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-line bg-soft/60 p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
            <Droplet className="h-5 w-5 fill-brand" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy">Blood Availability</h2>
            <p className="text-sm text-slate-600">Registered donors by blood group across Somalia.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BLOOD_TYPES.map((type) => {
            const count = stats?.[type]?.count || 0;
            const status = statusOf(count);
            return (
              <div
                key={type}
                className="rounded-2xl border border-line bg-white px-3 py-4 text-center shadow-sm"
              >
                <p className="text-2xl font-extrabold text-navy">{type}</p>
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <p className="mt-2 text-xs text-slate-500">
                  {count} {count === 1 ? "donor" : "donors"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BloodAvailability;
