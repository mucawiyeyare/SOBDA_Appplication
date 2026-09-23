import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import PartnerLogo from "./PartnerLogo.jsx";

// Up to this many logos sit in a centered row; beyond it the strip auto-scrolls.
const STATIC_LIMIT = 5;

function PartnersMarquee() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    axios
      .get("/api/partners")
      .then((res) => setPartners(res.data || []))
      .catch(() => {});
  }, []);

  if (partners.length === 0) return null;

  const scrolling = partners.length > STATIC_LIMIT;
  // Duplicate the list so the CSS animation can loop seamlessly from -50%.
  const track = [...partners, ...partners];

  return (
    <section id="partners" className="overflow-hidden border-y border-line bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">Our Partners</h2>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">
              Hospitals and institutions working with SOBDA.
            </p>
          </div>
          <Link to="/partners" className="whitespace-nowrap font-bold text-red-700 hover:text-red-800">
            View all
          </Link>
        </div>

        {!scrolling && (
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
            {partners.map((partner) => (
              <PartnerLogo key={partner._id} partner={partner} />
            ))}
          </div>
        )}
      </div>

      {scrolling && (
        <div className="partners-marquee-mask relative">
          <div className="partners-marquee-track flex w-max items-start gap-10 px-5">
            {track.map((partner, index) => (
              <PartnerLogo key={`${partner._id}-${index}`} partner={partner} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .partners-marquee-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
          mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
        }
        .partners-marquee-track {
          animation: partners-scroll 35s linear infinite;
        }
        .partners-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes partners-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

export default PartnersMarquee;
