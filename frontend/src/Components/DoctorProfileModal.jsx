import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle } from "lucide-react";
import DoctorPhoto from "./DoctorPhoto.jsx";
import { doctorDisplayName, initialsOf } from "../utils/doctorName.js";
import { accentFor, SOCIAL_LINKS, safeUrl } from "../utils/doctorStyle.js";

// Full profile of a doctor ("View Profile").
function DoctorProfileModal({ doctor, onClose, onAsk }) {
  const displayName = doctorDisplayName(doctor.name);
  const accent = accentFor(doctor._id);
  const { BadgeIcon } = accent;
  const highlights = (doctor.highlights || []).filter(Boolean).slice(0, 3);
  const socials = SOCIAL_LINKS.map((s) => ({ ...s, url: safeUrl(doctor.socials?.[s.key]) })).filter((s) => s.url);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="font-brand fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${displayName} profile`}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {doctor.photo ? (
                <DoctorPhoto src={doctor.photo} alt={displayName} className="h-28 w-24 rounded-xl bg-soft" />
              ) : (
                <span className="flex h-28 w-24 items-center justify-center rounded-xl bg-soft text-3xl font-extrabold text-navy">
                  {initialsOf(doctor.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accent.badge}`}>
                <BadgeIcon className="h-3.5 w-3.5" />
                {doctor.specialty}
              </span>
              <h2 className="mt-2 break-words text-2xl font-extrabold text-navy">{displayName}</h2>
              {doctor.title && <p className="text-sm text-slate-500">{doctor.title}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {doctor.bio && <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 sm:text-base">{doctor.bio}</p>}

        {highlights.length > 0 && (
          <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
            {highlights.map((text, i) => {
              const Icon = accent.icons[i % accent.icons.length];
              return (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${accent.icon}`} />
                  <span className="break-words">{text}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex items-center gap-2">
            {socials.map(({ key, label, Icon, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${displayName} on ${label}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${accent.social}`}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          {doctor.canChat ? (
            <button
              type="button"
              onClick={onAsk}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-navy/25 hover:bg-navy-deep"
            >
              <MessageCircle className="h-4 w-4" />
              Start Chat
            </button>
          ) : (
            <button type="button" onClick={onClose} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-navy hover:bg-soft">
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DoctorProfileModal;
