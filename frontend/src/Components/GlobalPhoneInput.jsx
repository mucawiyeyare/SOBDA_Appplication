import React, { useState } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { COUNTRY_CODES, validatePhone } from "../utils/countryCodes.js";

/**
 * Reusable Global Phone & WhatsApp Input with Country Code Selector
 * Matches NTW/HU unified input design.
 *
 * @param {string} value - Current phone digits
 * @param {string} countryCode - ISO country code (e.g. "SO")
 * @param {function} onChange - ({ countryCode, dialCode, phone, fullNumber, isValid, error }) => void
 * @param {string} placeholder
 * @param {boolean} required
 * @param {string} className
 * @param {string} id
 * @param {string} name
 */
export function GlobalPhoneInput({
  value = "",
  countryCode = "SO",
  onChange,
  placeholder = "e.g. 615000000 or 0771007272",
  required = true,
  id = "phone",
  name = "phone",
  disabled = false,
}) {
  const [selectedCountry, setSelectedCountry] = useState(countryCode);
  const [touched, setTouched] = useState(false);

  const activeCountry = COUNTRY_CODES.find((c) => c.code === selectedCountry) || COUNTRY_CODES[0];

  const handleCountryChange = (e) => {
    const newCode = e.target.value;
    setSelectedCountry(newCode);
    const countryObj = COUNTRY_CODES.find((c) => c.code === newCode) || COUNTRY_CODES[0];
    const validation = validatePhone(value, newCode);

    if (onChange) {
      onChange({
        countryCode: countryObj.code,
        dialCode: countryObj.dialCode,
        phone: value,
        fullNumber: `${countryObj.dialCode} ${value}`.trim(),
        isValid: validation.isValid,
        error: validation.error,
      });
    }
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const validation = validatePhone(rawVal, selectedCountry);

    if (onChange) {
      onChange({
        countryCode: activeCountry.code,
        dialCode: activeCountry.dialCode,
        phone: rawVal,
        fullNumber: `${activeCountry.dialCode} ${rawVal}`.trim(),
        isValid: validation.isValid,
        error: validation.error,
      });
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const validation = validatePhone(value, selectedCountry);
  const showError = touched && value && !validation.isValid;

  return (
    <div className="w-full">
      {/* Unified Input Container Pill */}
      <div
        className={`relative flex items-center bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
          showError
            ? "border-red-500 ring-2 ring-red-500/20"
            : "border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20"
        }`}
      >
        {/* Country Selector with Flag & Dial Code */}
        <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/80 transition-colors border-r border-slate-200 px-3 py-3 flex-shrink-0 cursor-pointer">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            disabled={disabled}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            title="Select Country Code"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.dialCode} ({c.name})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm pointer-events-none select-none">
            <span className="text-base leading-none">{activeCountry.flag}</span>
            <span className="font-mono tracking-tight">{activeCountry.code} {activeCountry.dialCode}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
          </div>
        </div>

        {/* Phone Digits Input Field */}
        <input
          type="tel"
          id={id}
          name={name}
          value={value}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 font-semibold text-sm sm:text-base outline-none"
        />
      </div>

      {/* Helper / Validation Guidance */}
      {selectedCountry === "SO" ? (
        <p
          className={`text-[11px] mt-1.5 transition-colors ${
            showError ? "text-red-600 font-bold flex items-center gap-1" : "text-slate-500"
          }`}
        >
          {showError && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          Use 9 digits starting with 61, 77, 63, 62, 90, 65, 66, 68, 69, or 71. A 10-digit number must start with 0.
        </p>
      ) : (
        <p className="text-[11px] text-slate-500 mt-1.5">
          International direct dialing: <strong className="text-slate-800 font-bold">{activeCountry.dialCode} {value || "XXXXXXX"}</strong>
        </p>
      )}
    </div>
  );
}

export default GlobalPhoneInput;
