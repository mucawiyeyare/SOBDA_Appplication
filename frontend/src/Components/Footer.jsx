import React from "react";
import { Link } from "react-router-dom";
import { Heart, Phone, Mail } from "lucide-react";
import SomaliaFlag from "./SomaliaFlag.jsx";
import SobdaLogo from "./SobdaLogo.jsx";

const FOOTER_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/doctors", label: "Doctors" },
  { to: "/partners", label: "Partners" },
  { to: "/contact", label: "Contact" },
  { to: "/signin", label: "Login" },
  { to: "/signup", label: "Become Donor" },
];

function Footer() {
  return (
    <footer className="font-brand border-t border-line bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <SobdaLogo size="md" />

          <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 lg:justify-center text-sm">
            {FOOTER_LINKS.map((link, i) => (
              <React.Fragment key={link.to}>
                {i > 0 && <span className="px-2 text-slate-300">|</span>}
                <Link to={link.to} className="text-slate-600 transition-colors hover:text-brand">
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          <div className="space-y-2 text-sm text-slate-600">
            <a href="tel:+252616408886" className="flex items-center gap-2.5 hover:text-brand">
              <Phone className="h-4 w-4 text-slate-400" />
              +252 61 640 8886
            </a>
            <a href="mailto:info@sobda.org" className="flex items-center gap-2.5 hover:text-brand">
              <Mail className="h-4 w-4 text-slate-400" />
              info@sobda.org
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-5 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} SOBDA. All rights reserved.</p>
          <p className="hidden md:block">Together We Save Lives.</p>
          <p className="flex items-center gap-2">
            <SomaliaFlag className="h-5 w-auto" />
            Made in Somalia
            <Heart className="h-4 w-4 fill-brand text-brand" />
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
