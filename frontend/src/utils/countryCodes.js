export const COUNTRY_CODES = [
  { code: "SO", name: "Somalia", dialCode: "+252", flag: "🇸🇴" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "ET", name: "Ethiopia", dialCode: "+251", flag: "🇪🇹" },
  { code: "DJ", name: "Djibouti", dialCode: "+253", flag: "🇩🇯" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "UG", name: "Uganda", dialCode: "+256", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", dialCode: "+255", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda", dialCode: "+250", flag: "🇷🇼" },
  { code: "SD", name: "Sudan", dialCode: "+249", flag: "🇸🇩" },
  { code: "SS", name: "South Sudan", dialCode: "+211", flag: "🇸🇸" },
  { code: "YE", name: "Yemen", dialCode: "+967", flag: "🇾🇪" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "JO", name: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
];

/**
 * Valid Somali mobile prefixes:
 * 61 (Hormuud), 77 (Somlink/Hormuud 77), 63 (Telesom), 62 (Somtel), 90 (Golis),
 * 65 (Somtel), 66 (Somtel), 68 (Somnet), 69 (Somnet), 71 (Somlink)
 */
export const SOMALIA_VALID_PREFIXES = ["61", "77", "63", "62", "90", "65", "66", "68", "69", "71"];

/**
 * Validates phone based on country code
 * @param {string} phone
 * @param {string} countryCode e.g. "SO"
 * @returns {{ isValid: boolean, error: string }}
 */
export const validatePhone = (phone, countryCode = "SO") => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required." };
  }

  const clean = phone.replace(/\D/g, "");

  if (countryCode === "SO") {
    // If 10 digits, must start with 0
    if (clean.length === 10) {
      if (!clean.startsWith("0")) {
        return {
          isValid: false,
          error: "A 10-digit number must start with 0 (e.g. 061XXXXXXX or 077XXXXXXX).",
        };
      }
      const sub = clean.substring(1);
      const hasValidPrefix = SOMALIA_VALID_PREFIXES.some((p) => sub.startsWith(p));
      if (!hasValidPrefix) {
        return {
          isValid: false,
          error: "Must start with 61, 77, 63, 62, 90, 65, 66, 68, 69, or 71.",
        };
      }
      return { isValid: true, error: "" };
    }

    // If 9 digits
    if (clean.length === 9) {
      const hasValidPrefix = SOMALIA_VALID_PREFIXES.some((p) => clean.startsWith(p));
      if (!hasValidPrefix) {
        return {
          isValid: false,
          error: "Must start with 61, 77, 63, 62, 90, 65, 66, 68, 69, or 71.",
        };
      }
      return { isValid: true, error: "" };
    }

    // If 7 digits (traditional subscriber digits)
    if (clean.length === 7) {
      return { isValid: true, error: "" };
    }

    return {
      isValid: false,
      error: "Use 9 digits starting with 61, 77, 63, 62, 90, 65, 66, 68, 69, or 71. A 10-digit number must start with 0.",
    };
  }

  // Other global countries: check length >= 6
  if (clean.length < 6 || clean.length > 15) {
    return {
      isValid: false,
      error: "Please enter a valid phone number (6 to 15 digits).",
    };
  }

  return { isValid: true, error: "" };
};
