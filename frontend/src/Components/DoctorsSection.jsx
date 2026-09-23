import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import DoctorCard from "./DoctorCard.jsx";
import DoctorsHeading from "./DoctorsHeading.jsx";

const HOME_LIMIT = 3;

function DoctorsSection() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    axios
      .get("/api/doctors")
      .then((res) => setDoctors(res.data || []))
      .catch(() => {});
  }, []);

  if (doctors.length === 0) return null;

  return (
    <section id="doctors" className="relative overflow-hidden bg-white py-16 sm:py-20">
      {/* faint heartbeat line, as in the mockup */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 80"
        className="pointer-events-none absolute right-6 top-6 hidden h-28 w-64 text-slate-200 md:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 42 H55 L68 42 L78 12 L94 70 L106 30 L114 42 H200" />
      </svg>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <DoctorsHeading />

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {doctors.slice(0, HOME_LIMIT).map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 rounded-full border border-navy/30 bg-white px-6 py-3 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-navy hover:bg-soft"
          >
            Meet Our Medical Team <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default DoctorsSection;
