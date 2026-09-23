import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Droplet, ArrowRight, ShieldCheck } from "lucide-react";
import SplitHero from "../Components/SplitHero.jsx";
import DoctorCard from "../Components/DoctorCard.jsx";
import DoctorsHeading from "../Components/DoctorsHeading.jsx";
import CtaBanner from "../Components/CtaBanner.jsx";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/doctors")
      .then((res) => setDoctors(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="font-brand bg-white">
      <SplitHero
        eyebrow="Our Doctors"
        title={
          <>
            Talk to a <span className="text-brand">Doctor</span>
          </>
        }
        text="Get eligibility guidance before you donate. Our volunteer doctors and medical professionals support the blood donation process and help keep every donor and patient safe."
        actions={
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-colors hover:bg-brand-dark"
          >
            <Droplet className="h-4 w-4" /> Become a Donor <ArrowRight className="h-4 w-4" />
          </Link>
        }
        extra={
          <div className="inline-flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm text-navy shadow-sm">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 text-brand" />
            <span>
              <strong>Safe and healthy communities.</strong> Ask before you donate.
            </span>
          </div>
        }
        image="/hero5.jpg"
        imageAlt="A hand holding a bag of donated blood"
        tagline="Care you can trust"
      />

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <DoctorsHeading />

          <div className="mt-12">
            {loading ? (
              <p className="py-12 text-center text-sm text-slate-400">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                No doctors are listed yet. Please check back soon.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <CtaBanner
        variant="red"
        title="Be Part of the Change"
        text="Donate blood today and help build a healthier Somalia."
        label="Become Donor"
        to="/signup"
      />
    </div>
  );
}

export default Doctors;
