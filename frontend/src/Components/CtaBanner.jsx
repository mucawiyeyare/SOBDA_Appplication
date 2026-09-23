import React from "react";
import { Link } from "react-router-dom";
import { Droplet, ArrowRight } from "lucide-react";

// Call-to-action banner: a white card with a single red button.
function CtaBanner({ title, text, label, to }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white px-6 py-7 shadow-sm sm:px-10 sm:py-8">
        <Droplet className="pointer-events-none absolute -bottom-10 -right-6 h-48 w-48 text-slate-100" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-soft text-brand">
              <Droplet className="h-7 w-7 fill-brand" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-navy sm:text-2xl">{title}</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600 sm:text-base">{text}</p>
            </div>
          </div>
          <Link
            to={to}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-colors hover:bg-brand-dark"
          >
            {label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CtaBanner;
