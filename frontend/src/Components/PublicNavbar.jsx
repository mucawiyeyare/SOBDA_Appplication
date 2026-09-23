import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Droplet } from "lucide-react";
import SobdaLogo from "./SobdaLogo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/doctors", label: "Doctors" },
  { to: "/partners", label: "Partners" },
  { to: "/contact", label: "Contact" },
];

function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const loggedIn = Boolean(localStorage.getItem("token"));

  const isActive = (path) => location.pathname === path;

  const desktopLink = (path) =>
    `relative px-1 py-2 text-sm font-semibold transition-colors ${
      isActive(path) ? "text-sky-700" : "text-navy hover:text-sky-700"
    }`;

  const mobileLink = (path) =>
    `block rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
      isActive(path) ? "bg-sky-50 text-sky-700" : "text-navy hover:bg-sky-50 hover:text-sky-700"
    }`;

  return (
    <nav className="font-brand sticky top-0 z-50 border-b border-sky-100 bg-white/95 shadow-[0_4px_20px_-8px_rgba(14,80,160,0.18)] backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-4" onClick={() => setIsMenuOpen(false)}>
            <SobdaLogo size="md" />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={desktopLink(link.to)}>
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute inset-x-0 -bottom-[13px] h-0.5 rounded bg-sky-600" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {loggedIn ? (
              <Link
                to="/dashboard"
                className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-700/20 transition-colors hover:bg-sky-800"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <User className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-colors hover:bg-brand-dark"
                >
                  <Droplet className="h-4 w-4" />
                  Become Donor
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-navy transition-colors hover:bg-sky-50"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-sky-100 py-4">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={mobileLink(link.to)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {loggedIn ? (
                  <Link
                    to="/dashboard"
                    className="rounded-xl bg-sky-700 px-4 py-3 text-center text-sm font-semibold text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      className="rounded-xl border border-sky-200 px-4 py-3 text-center text-sm font-semibold text-sky-800"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Become Donor
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default PublicNavbar;
