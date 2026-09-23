import React from "react";
import { HeartPulse } from "lucide-react";

// "OUR DOCTORS" pill + big heading + intro, shared by the Home section and the Doctors page.
function DoctorsHeading() {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <span className="h-px w-10 bg-navy/20 sm:w-20" />
        <span className="inline-flex items-center gap-3 rounded-full bg-soft py-1 pl-1 pr-5 sm:pr-7">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand shadow-sm sm:h-11 sm:w-11">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-navy sm:text-sm">Our Doctors</span>
        </span>
        <span className="h-px w-10 bg-navy/20 sm:w-20" />
      </div>
      <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">
        Meet Our <span className="text-brand">Experienced</span> Doctors
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
        Our team of qualified doctors and medical professionals are here to support the blood donation
        process and ensure safe and healthy communities.
      </p>
    </div>
  );
}

export default DoctorsHeading;
