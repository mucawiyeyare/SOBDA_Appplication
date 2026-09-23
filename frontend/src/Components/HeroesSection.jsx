import React, { useState } from "react";
import { Trophy } from "lucide-react";

// "Our Blood Heroes": the public top-3 donors leaderboard, with a click-to-enlarge photo lightbox.
export default function HeroesSection({ leaderboard }) {
  const [lightboxImage, setLightboxImage] = useState(null); // { src, name }

  return (
    <>
      {/* ─── Lightbox overlay ─── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-red-50 hover:text-red-600 shadow-lg text-xl font-bold z-10"
            >
              ×
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.name}
                className="w-full h-auto object-cover"
              />
            </div>
            <p className="text-white text-center mt-3 font-bold text-lg tracking-wide drop-shadow">
              {lightboxImage.name}
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Donors Leaderboard (White Background) */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-soft border border-line text-navy text-xs font-bold mb-4 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Hall of Heroes — Top Donors</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">Our Blood Heroes 🏆</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto mb-12">
            These amazing donors have saved the most lives on SOBDA. Keep going!
          </p>

          {/* Show up to 3 real donors; only pad with placeholder slots if fewer than 3 donated */}
          {leaderboard.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">Be the first hero — donate blood today! 🩸</p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: Math.max(leaderboard.length, 3) }).map((_, index) => {
              // Only render placeholder if we have < 3 real donors AND this slot is empty
              if (index >= 3) return null;
              const donor = leaderboard[index] || null;
              const medals = ["🥇", "🥈", "🥉"];
              const rankLabels = ["1st Place", "2nd Place", "3rd Place"];
              const cardStyles = [
                "bg-white border border-line shadow-sm",
                "bg-white border border-line shadow-sm",
                "bg-white border border-line shadow-sm",
              ];
              const getMessage = (d, idx) => {
                if (!d) return "";
                if (d.donationCount === 1) {
                  const singleQuotes = [
                    "You saved 1 person! Keep saving lives! 🏆",
                    "Saved 1 person! You're a true hero! ⭐",
                    "Saved 1 person! Fantastic effort! 💪",
                  ];
                  return singleQuotes[idx] || "You saved 1 person! Keep it up! 🏆";
                }
                const multiQuotes = [
                  `Saved ${d.donationCount} people! Keep saving lives! 🏆`,
                  `Saved ${d.donationCount} people! You're a true hero! ⭐`,
                  `Saved ${d.donationCount} people! Fantastic effort! 💪`,
                ];
                return multiQuotes[idx] || `Saved ${d.donationCount} people! 🏆`;
              };

              return (
                <div
                  key={index}
                  className={`${cardStyles[index]} rounded-2xl p-6 text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
                >
                  {/* Hero Avatar with Medal Overlay */}
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    {donor ? (
                      <div
                        onClick={() => {
                          if (donor.profileImage) {
                            setLightboxImage({ src: donor.profileImage, name: `${donor.firstName}${donor.lastInitial ? " " + donor.lastInitial + "." : ""}` });
                          }
                        }}
                        className={`w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-black text-2xl ${donor.profileImage ? "cursor-pointer hover:opacity-90 hover:scale-105 transition-all" : "cursor-default"}`}
                        title={donor.profileImage ? "Click to enlarge" : ""}
                      >
                        {donor.profileImage ? (
                          <img
                            src={donor.profileImage}
                            alt={donor.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{donor.firstName ? donor.firstName.charAt(0).toUpperCase() : "D"}</span>
                        )}
                      </div>
                    ) : (
                      /* Placeholder empty slot */
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300 text-3xl">
                        ?
                      </div>
                    )}
                    <div className="absolute -top-1.5 -right-1.5 text-2xl drop-shadow-md">
                      {medals[index]}
                    </div>
                  </div>

                  {donor ? (
                    <>
                      <p className="text-xl font-black text-slate-900">
                        {donor.firstName}{donor.lastInitial ? ` ${donor.lastInitial}.` : ""}
                      </p>
                      <div className="my-2.5">
                        <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-black">
                          Blood Type: {donor.bloodType}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium">{donor.location}</p>
                      <div className="mt-4 py-2.5 px-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-2xl font-black text-slate-900">{donor.donationCount}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {donor.donationCount === 1 ? "Donation Completed" : "Donations Completed"}
                        </p>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                          <span>❤️</span>
                          <span>{donor.donationCount === 1 ? "1 Person Saved" : `${donor.donationCount} People Saved`}</span>
                        </div>
                      </div>
                      <p className="text-xs text-red-600 mt-3 font-semibold italic">"{getMessage(donor, index)}"</p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-bold text-slate-400 mt-1">{rankLabels[index]}</p>
                      <p className="text-xs text-slate-400 mt-1">No donor yet</p>
                      <div className="mt-4 py-2.5 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-2xl font-black text-slate-300">—</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Donations Completed
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                          0 People Saved
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 italic">Could this be you? 🩸</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          )}

          <p className="text-slate-400 text-xs">
            🔒 Only first name shown for privacy. Rankings update in real time.
          </p>
        </div>
      </section>

    </>
  );
}
