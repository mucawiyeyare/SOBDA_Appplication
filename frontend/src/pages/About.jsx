import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  HeartPulse,
  Target,
  Eye,
  Heart,
  Users,
  Droplet,
  Building2,
  MapPin,
  Stethoscope,
  Star,
  Quote,
  ArrowRight,
} from "lucide-react";
import SplitHero from "../Components/SplitHero.jsx";
import Eyebrow from "../Components/Eyebrow.jsx";
import PartnerLogo from "../Components/PartnerLogo.jsx";
import CtaBanner from "../Components/CtaBanner.jsx";
import usePublicReport from "../hooks/usePublicReport.js";

const PILLARS = [
  {
    icon: Target,
    title: "Our Mission",
    text: "To ensure safe, reliable and efficient blood donation services for every person in Somalia.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    text: "A Somalia where no one dies because of a lack of blood.",
  },
  {
    icon: Heart,
    title: "Our Values",
    text: "Life  •  Trust  •  Solidarity  •  Transparency  •  Service",
  },
  {
    icon: Users,
    title: "What We Do",
    text: "Connect donors with hospitals, manage blood requests, support health centers and build a strong blood donation community.",
  },
];

function About() {
  const { report, doctorsCount } = usePublicReport();
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    axios
      .get("/api/partners")
      .then((res) => setPartners(res.data || []))
      .catch(() => {});
  }, []);

  const impact = [
    { icon: Droplet, value: report.activityStats.totalDonors, label: "Registered Donors" },
    { icon: Building2, value: report.activityStats.totalHospitals, label: "Hospitals Connected" },
    { icon: MapPin, value: report.activityStats.regionsCovered || 0, label: "Regions Covered" },
    { icon: Stethoscope, value: doctorsCount, label: "Doctors On Board" },
  ];

  return (
    <div className="font-brand bg-white">
      <SplitHero
        eyebrow="About Us"
        title={
          <>
            Together for a Healthier <span className="text-brand">Somalia</span>
          </>
        }
        text="SOBDA (Somali Blood Donation Association) is a national platform that connects blood donors, hospitals and patients across Somalia. We make it easier, safer and faster to donate blood and save lives."
        extra={
          <div className="inline-flex items-center gap-4 rounded-2xl border border-line bg-white/80 px-5 py-4 shadow-sm">
            <HeartPulse className="h-9 w-9 flex-shrink-0 text-brand" />
            <div className="text-sm text-navy">
              <p className="font-bold">One donation can save up to three lives.</p>
              <p className="text-slate-600">Be a hero. Donate blood.</p>
            </div>
          </div>
        }
        image="/hero5.jpg"
        imageAlt="A hand holding a bag of donated blood"
        tagline="Blood connects us all"
      />

      {/* About SOBDA */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-6 rounded-3xl border border-line bg-soft/60 p-5 sm:p-7 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <Eyebrow className="mb-3">About SOBDA</Eyebrow>
            <p className="text-slate-700 leading-relaxed">
              SOBDA is a modern and secure blood donation management system built for Somalia. Our
              goal is to build a stronger, safer and healthier nation by connecting generous donors
              with those in need of blood.
            </p>
            <p className="mt-4 text-slate-700 leading-relaxed">
              We work with hospitals, health centers, donors, partners and the Ministry of Health to
              ensure blood is available when and where it&apos;s needed most.
            </p>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-line bg-white">
            <Star className="absolute left-[34%] top-[42%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 fill-[#4189dd] text-[#4189dd] sm:h-44 sm:w-44" />
            <p className="absolute bottom-5 right-6 max-w-[14rem] text-right font-script text-3xl leading-[1.05] text-navy sm:text-4xl">
              Healthy People Stronger Somalia
              <span className="ml-auto mt-1 block h-1 w-28 rounded bg-brand" />
            </p>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values / What we do */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex flex-col items-center px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-soft text-brand">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-extrabold text-navy">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{pillar.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Our impact */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 rounded-3xl border border-line bg-soft/70 p-5 sm:p-7 lg:grid-cols-[1fr_3fr]">
          <div>
            <Eyebrow className="mb-2">Our Impact</Eyebrow>
            <p className="text-sm text-slate-600">Together, we are saving lives across Somalia.</p>
          </div>
          <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-line">
            {impact.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center px-4 text-center">
                  <Icon className="mb-2 h-7 w-7 text-brand" />
                  <p className="text-2xl font-extrabold text-navy sm:text-3xl">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partners + quote */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <Eyebrow className="mb-2">Our Partners</Eyebrow>
            <p className="mb-5 max-w-lg text-sm text-slate-600">
              We work closely with trusted organizations and institutions to make our mission possible.
            </p>
            {partners.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-4">
                {partners.slice(0, 4).map((partner) => (
                  <PartnerLogo key={partner._id} partner={partner} />
                ))}
              </div>
            )}
            <Link
              to="/partners"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-colors hover:bg-brand-dark"
            >
              Our Partners <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col justify-center rounded-3xl border border-line bg-white p-7 shadow-sm sm:p-9">
            <Quote className="mb-3 h-9 w-9 text-brand" />
            <p className="text-xl font-semibold leading-snug text-navy sm:text-2xl">
              Blood donation is not just a gift of blood, it is a gift of life.
            </p>
            <span className="mt-5 block h-0.5 w-10 rounded bg-brand" />
            <p className="mt-3 text-sm font-semibold text-slate-500">SOBDA Team</p>
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

export default About;
