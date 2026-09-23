import React from "react";

// Partner: a round logo with the organization's name underneath; links to the partner's website.
function PartnerLogo({ partner }) {
  return (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noreferrer"
      title={partner.name}
      className="group flex w-40 flex-shrink-0 flex-col items-center text-center sm:w-48"
    >
      <div className="h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg sm:h-36 sm:w-36">
        <img src={partner.logo} alt={partner.name} className="h-full w-full object-cover" />
      </div>
      <span className="mt-4 line-clamp-2 text-sm font-semibold leading-snug text-slate-700 sm:text-base">
        {partner.name}
      </span>
    </a>
  );
}

export default PartnerLogo;
