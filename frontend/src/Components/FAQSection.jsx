import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Heart,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Info,
} from "lucide-react";

export const FAQ_ITEMS = [
  {
    q: "Does it hurt?",
    a: "You'll feel a small pinch when the needle goes in, similar to a regular blood test. The donation itself is painless.",
  },
  {
    q: "How long does the donation take?",
    a: "The actual donation takes about 8–10 minutes. With registration, medical screening, and rest afterwards, the whole visit is around 30–45 minutes.",
  },
  {
    q: "How often can I donate?",
    a: "Whole blood donors can give every 90 days (about 3 months). Your body fully replaces the blood within a few weeks.",
  },
  {
    q: "Will my information be public?",
    a: "No. Your contact details are private and only visible to verified hospitals in our network. We never share your information with the public or third parties.",
  },
  {
    q: "What if I'm scared of needles?",
    a: "That's completely normal. Hospital staff are experienced at making donors comfortable. Many donors say it was easier than they expected.",
  },
  {
    q: "How will hospitals contact me?",
    a: "A hospital will contact you directly via phone or WhatsApp on the number you provided. You can always say no if you're unable to donate at that time.",
  },
  {
    q: "Is there any cost?",
    a: "No. Donating blood is completely free. Patients receiving blood also do not pay for the blood itself.",
  },
  {
    q: "Can I unregister later?",
    a: "Yes — contact us anytime and we'll remove your information from the network.",
  },
];

function FAQSection({ stats }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const totalDonors = stats?.activityStats?.totalDonors || 0;
  const totalHospitals = stats?.activityStats?.totalHospitals || 0;
  const regionsCovered = stats?.activityStats?.regionsCovered || 18;
  const livesSaved = totalDonors * 3;

  return (
    <div className="w-full bg-white">
      {/* 1. Red Impact Stats Bar */}
      <section className="bg-white text-navy py-12 px-4 sm:px-6 lg:px-8 border-y border-line">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-4xl sm:text-5xl font-black tracking-tight">{totalDonors}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Registered donors</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl sm:text-5xl font-black tracking-tight">{regionsCovered}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Regions covered</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl sm:text-5xl font-black tracking-tight">{totalHospitals}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Partner hospitals</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl sm:text-5xl font-black tracking-tight">{livesSaved}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Lives potentially saved</p>
          </div>
        </div>
      </section>

      {/* 2. Eligibility Section: "Can I donate blood?" */}
      <section id="eligibility" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-2">
            ELIGIBILITY
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            Can I donate blood?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
            Most healthy adults can donate. Here's the basic guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: You can donate if you... */}
          <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5 text-navy font-bold text-base sm:text-lg mb-6 pb-3 border-b border-line">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <span>You can donate if you...</span>
            </div>
            <ul className="space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Are 16 years or older</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Weigh at least 50 kg</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Are in good general health</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Have no recent fever or infection</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Have not donated in the last 3 months</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Please wait if you... */}
          <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5 text-navy font-bold text-base sm:text-lg mb-6 pb-3 border-b border-line">
              <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <span>Please wait if you...</span>
            </div>
            <ul className="space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Are pregnant or recently gave birth</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Have a current infection or illness</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Took antibiotics in the last 2 weeks</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Had recent surgery or major dental work</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>Have certain chronic medical conditions</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-500 font-medium">
          The hospital will do a quick medical check before any donation to make sure it's safe for you and the patient.
        </p>
      </section>

      {/* 3. FAQ Section: "Common questions" */}
      <section id="faq" className="py-20 bg-white border-t border-line px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 block mb-2">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              Common questions
            </h2>
            <p className="text-slate-500 text-sm">Everything you need to know about blood donation on SOBDA</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-200 shadow-sm hover:border-slate-300"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full py-5 px-6 flex items-center justify-between text-left gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-base font-bold text-slate-800">
                      {item.q}
                    </span>
                    <span className="p-1 rounded-full text-slate-400 bg-slate-100 flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-red-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30 animate-fadeIn">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. "Ready to save a life?" CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-8 h-8 fill-red-600 text-red-600 animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Ready to save a life?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
            Join thousands of Somalis who've already registered. It takes less than a minute.
          </p>
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-red-600/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span>Register as Donor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FAQSection;
