import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import axios from "axios";
import { X, Send, CheckCircle2, Info } from "lucide-react";
import { doctorDisplayName, initialsOf } from "../utils/doctorName.js";

const MAX_LEN = 2000;

// Public-site "Ask Doctor" box. The question goes to the doctor's inbox inside SOBDA (not WhatsApp).
// Sending needs a donor login so the doctor's answer can reach the donor.
function AskDoctorModal({ doctor, onClose }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const name = doctorDisplayName(doctor.name);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError("");
    try {
      await axios.post(`/api/consult/thread/${doctor._id}`, { text: value }, { headers: { Authorization: `Bearer ${token}` } });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Your question could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const avatar = doctor.photo ? (
    <img src={doctor.photo} alt="" className="h-12 w-12 flex-shrink-0 rounded-full bg-soft object-cover" />
  ) : (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft text-sm font-extrabold text-navy">
      {initialsOf(doctor.name)}
    </div>
  );

  let body;
  if (!token) {
    body = (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Please sign in as a donor to ask {name} a question. That way the doctor&apos;s answer reaches you in your
          dashboard.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/signin" onClick={onClose} className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark">
            Login
          </Link>
          <Link to="/signup" onClick={onClose} className="rounded-xl border border-navy/40 px-4 py-3 text-center text-sm font-semibold text-navy hover:bg-soft">
            Become a Donor
          </Link>
        </div>
      </div>
    );
  } else if (role !== "donor") {
    body = (
      <p className="rounded-xl bg-soft p-4 text-sm text-slate-600">
        Only donors can send questions to doctors. You are signed in with a {role} account.
      </p>
    );
  } else if (sent) {
    body = (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <div>
          <p className="text-lg font-extrabold text-navy">Question sent</p>
          <p className="mt-1 text-sm text-slate-600">
            {name} will answer inside SOBDA. We will notify you, and you can read the reply in your dashboard.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            to={`/dashboard/ask-doctor?doctor=${doctor._id}`}
            onClick={onClose}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Open my conversation
          </Link>
          <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-navy hover:bg-soft">
            Close
          </button>
        </div>
      </div>
    );
  } else {
    body = (
      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          rows={5}
          autoFocus
          placeholder={`Write the question you want to ask ${name}…`}
          className="w-full resize-none rounded-xl border border-line px-4 py-3 text-sm text-slate-800 outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
        />
        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>Doctors give general guidance only. In an emergency, go to the nearest hospital.</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link to={`/dashboard/ask-doctor?doctor=${doctor._id}`} onClick={onClose} className="text-xs font-semibold text-navy underline-offset-2 hover:underline">
            View past messages
          </Link>
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send question"}
          </button>
        </div>
      </form>
    );
  }

  // Rendered in <body> so the card's hover transform can't shift the fixed overlay
  return createPortal(
    <div
      className="font-brand fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ask ${name}`}
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {avatar}
            <div>
              <h2 className="text-lg font-extrabold text-navy">Ask Doctor</h2>
              <p className="text-sm text-slate-500">
                {name} · {doctor.specialty}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {body}
      </div>
    </div>,
    document.body
  );
}

export default AskDoctorModal;
