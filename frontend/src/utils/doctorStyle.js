import { Droplet, Heart, Stethoscope, GraduationCap, ShieldCheck, HeartPulse, Users, Star } from "lucide-react";
import { Facebook, Linkedin, Twitter } from "lucide-react";

// Three colour themes; each doctor always gets the same one (picked from their id).
export const ACCENTS = [
  {
    badge: "bg-soft text-navy",
    icon: "text-slate-500",
    social: "bg-soft text-slate-600 hover:bg-slate-200",
    blob: "from-slate-100 to-white",
    BadgeIcon: Droplet,
    icons: [GraduationCap, ShieldCheck, Heart],
  },
  {
    badge: "bg-soft text-navy",
    icon: "text-slate-500",
    social: "bg-soft text-slate-600 hover:bg-slate-200",
    blob: "from-slate-100 to-white",
    BadgeIcon: Heart,
    icons: [HeartPulse, Stethoscope, Users],
  },
  {
    badge: "bg-soft text-navy",
    icon: "text-slate-500",
    social: "bg-soft text-slate-600 hover:bg-slate-200",
    blob: "from-slate-100 to-white",
    BadgeIcon: Stethoscope,
    icons: [Droplet, Star, Users],
  },
];

export const accentFor = (id = "") => ACCENTS[[...String(id)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % ACCENTS.length];

export const SOCIAL_LINKS = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "twitter", label: "Twitter / X", Icon: Twitter },
];

// Only real http(s) links are ever rendered as links
export const safeUrl = (value) => (typeof value === "string" && /^https?:\/\//i.test(value) ? value : "");
