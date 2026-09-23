import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Handshake, ArrowRight, Mail } from "lucide-react";
import SplitHero from "../Components/SplitHero.jsx";
import PartnerLogo from "../Components/PartnerLogo.jsx";
import CtaBanner from "../Components/CtaBanner.jsx";
import Eyebrow from "../Components/Eyebrow.jsx";

function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/partners")
      .then((res) => setPartners(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="font-brand bg-white">
      <SplitHero
        eyebrow="Our Partners"
        title={
          <>
            Working Together to <span className="text-brand">Save Lives</span>
          </>
        }
        text="We work closely with trusted organizations and institutions, from the Ministry of Health to hospitals and health centers, to make our mission possible."
        actions={
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-colors hover:bg-brand-dark"
          >
            <Handshake className="h-4 w-4" /> Become a Partner <ArrowRight className="h-4 w-4" />
          </Link>
        }
        image="/hero2.jpg"
        imageAlt="Blood bags stored on shelves at a blood bank"
        tagline="Stronger together"
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <Eyebrow className="mb-2">Partners &amp; supporters</Eyebrow>
        <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">Institutions working with SOBDA</h2>
        <p className="mt-2 mb-8 max-w-2xl text-slate-600">
          Select a partner to visit their website.
        </p>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-400">Loading partners...</p>
        ) : partners.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            No partners are listed yet. Please check back soon.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-10">
            {partners.map((partner) => (
              <PartnerLogo key={partner._id} partner={partner} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-line bg-soft/70 p-5 text-sm text-navy">
          <Mail className="h-5 w-5 flex-shrink-0 text-brand" />
          <p>
            Want your organization listed here?{" "}
            <Link to="/contact" className="font-semibold text-brand underline-offset-2 hover:underline">
              Get in touch with us.
            </Link>
          </p>
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

export default Partners;
