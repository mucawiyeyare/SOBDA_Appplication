import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Droplet,
  Users,
  Building2,
  MapPin,
  Stethoscope,
  UserPlus,
  HeartPulse,
  HandHeart,
  Siren,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import ChatBot from "../Components/ChatBot.jsx";
import FAQSection from "../Components/FAQSection.jsx";
import SplitHero from "../Components/SplitHero.jsx";
import StatsBar from "../Components/StatsBar.jsx";
import Eyebrow from "../Components/Eyebrow.jsx";
import BloodAvailability from "../Components/BloodAvailability.jsx";
import DoctorsSection from "../Components/DoctorsSection.jsx";
import PartnersMarquee from "../Components/PartnersMarquee.jsx";
import HeroesSection from "../Components/HeroesSection.jsx";
import CtaBanner from "../Components/CtaBanner.jsx";
import usePublicReport from "../hooks/usePublicReport.js";

const HERO_SLIDES = [
  { image: "/hero-dhibic.jpg", alt: "A donor squeezing a red ball while giving blood: Hal dhibic oo dhiig ah ayaa badbaadin karta naf", focusRight: true },
  { image: "/hero1.jpg", alt: "Bags of donated blood labelled by blood type", tagline: "A single donation can save a life" },
  { image: "/hero5.jpg", alt: "A hand holding a bag of donated blood", tagline: "Blood connects us all" },
  { image: "/hero2.jpg", alt: "Blood bags stored on shelves at a blood bank", tagline: "Together We Save Lives" },
];

const STEPS = [
  { icon: UserPlus, title: "1. Register", text: "Create your account as a donor or hospital." },
  { icon: Droplet, title: "2. Donate", text: "Give blood and save lives." },
  { icon: HeartPulse, title: "3. Help Others", text: "Your donation helps patients in need." },
];

function Home() {
  const { report, doctorsCount } = usePublicReport();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    axios
      .get("/api/requests/leaderboard")
      .then((res) => setLeaderboard(res.data))
      .catch(() => {});
  }, []);

  const stats = [
    { icon: Users, value: report.activityStats.totalDonors, label: "Registered Donors" },
    { icon: Building2, value: report.activityStats.totalHospitals, label: "Hospitals Connected" },
    { icon: MapPin, value: report.activityStats.regionsCovered || 0, label: "Regions Covered" },
    { icon: Stethoscope, value: doctorsCount, label: "Doctors On Board" },
  ];

  return (
    <div className="font-brand bg-white">
      <SplitHero
        eyebrow="Somali Blood Donation Association"
        title={
          <>
            <span className="block text-[0.66em] leading-[1.2]">
              Dhiigga aad bixiso,<br /><span className="text-brand">waa nolol aad qof ugu hibeysay.</span>
            </span>
          </>
        }
        text="SOBDA connects blood donors, hospitals and patients across Somalia. Together, we can build a healthier and stronger nation."
        actions={
          <>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-colors hover:bg-brand-dark"
            >
              <Droplet className="h-4 w-4" /> Become a Donor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/40 bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-navy hover:bg-soft"
            >
              <PlayCircle className="h-4 w-4" /> Learn More
            </Link>
          </>
        }
        slides={HERO_SLIDES}
      />

      {/* Live platform numbers */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <StatsBar items={stats} />
      </section>

      <BloodAvailability stats={report.bloodTypeStats} />

      {/* Emergency request banner */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-line border-l-4 border-l-brand bg-white px-6 py-6 shadow-sm sm:px-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                <Siren className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-navy sm:text-2xl">Emergency Blood Request</h2>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  Need blood urgently? Submit a request now and get help from our donor network.
                </p>
              </div>
            </div>
            <Link
              to="/contact"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-colors hover:bg-brand-dark"
            >
              Request Blood Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow className="mb-3">How It Works</Eyebrow>
            <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
              It&apos;s simple. You can make a big difference.
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:text-center">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-soft ring-8 ring-soft/60">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy">{step.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{step.text}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <ArrowRight className="absolute -right-5 top-5 hidden h-5 w-5 text-slate-300 sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-soft to-white p-6 ring-1 ring-line sm:p-8">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md">
                <HandHeart className="h-12 w-12 text-brand" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-navy">Small Act...</p>
                <p className="text-3xl font-extrabold text-brand">Big Impact</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Your blood can give someone a second chance at life.
            </p>
          </div>
        </div>
      </section>

      <DoctorsSection />
      <PartnersMarquee />
      <HeroesSection leaderboard={leaderboard} />

      {/* FAQ & eligibility */}
      <FAQSection stats={report} />

      <CtaBanner
        variant="navy"
        title="Become a Donor Today"
        text="Your donation can save lives. Join our community of heroes and make a real difference."
        label="Register as a Donor"
        to="/signup"
      />

      <ChatBot />
    </div>
  );
}

export default Home;
