export const SOMALI_CARRIERS = [
  { id: "hormuud", name: "Hormuud", code: "+252 61", label: "Hormuud (+252 61 / 061)", prefix: "61" },
  { id: "somlink_77", name: "Somlink / Hormuud 77", code: "+252 77", label: "Somlink / Hormuud (+252 77 / 077)", prefix: "77" },
  { id: "somtel_62", name: "Somtel", code: "+252 62", label: "Somtel (+252 62 / 062)", prefix: "62" },
  { id: "somtel_65", name: "Somtel", code: "+252 65", label: "Somtel (+252 65 / 065)", prefix: "65" },
  { id: "telesom", name: "Telesom", code: "+252 63", label: "Telesom (+252 63 / 063)", prefix: "63" },
  { id: "golis", name: "Golis", code: "+252 90", label: "Golis (+252 90 / 090)", prefix: "90" },
  { id: "somnet", name: "Somnet", code: "+252 68", label: "Somnet (+252 68 / 068)", prefix: "68" },
  { id: "other", name: "National", code: "+252", label: "Other / (+252)", prefix: "" },
];

/**
 * Parses any user phone input and automatically detects the Somali carrier code and subscriber digits.
 *
 * @param {string} rawInput
 * @param {string} currentCarrierCode
 * @returns {{ carrierCode: string, carrierName: string, subscriberNumber: string, fullFormatted: string, cleanDigits: string }}
 */
export const parseSomaliPhone = (rawInput, currentCarrierCode = "+252 61") => {
  if (!rawInput) {
    const defaultCarrier = SOMALI_CARRIERS.find(c => c.code === currentCarrierCode) || SOMALI_CARRIERS[0];
    return {
      carrierCode: defaultCarrier.code,
      carrierName: defaultCarrier.name,
      subscriberNumber: "",
      fullFormatted: "",
      cleanDigits: "",
    };
  }

  let clean = rawInput.toString().replace(/\D/g, "");

  // If user included Somalia country code 252 at the start
  if (clean.startsWith("252") && clean.length > 3) {
    clean = clean.substring(3);
  }

  // If user entered leading 0 (e.g. 0616408886 or 0771007272)
  if (clean.startsWith("0") && clean.length > 1) {
    clean = clean.substring(1);
  }

  // Detect matching carrier
  const matchedCarrier = SOMALI_CARRIERS.find(c => c.prefix && clean.startsWith(c.prefix));

  if (matchedCarrier && clean.length >= 2) {
    const subscriberNumber = clean.startsWith(matchedCarrier.prefix)
      ? clean.substring(matchedCarrier.prefix.length)
      : clean;

    const fullFormatted = `${matchedCarrier.code} ${subscriberNumber}`.trim();
    const cleanDigits = `252${matchedCarrier.prefix}${subscriberNumber}`;

    return {
      carrierCode: matchedCarrier.code,
      carrierName: matchedCarrier.name,
      subscriberNumber,
      fullFormatted,
      cleanDigits,
    };
  }

  const selectedCarrier = SOMALI_CARRIERS.find(c => c.code === currentCarrierCode) || SOMALI_CARRIERS[0];
  const fullFormatted = `${selectedCarrier.code} ${clean}`.trim();
  const cleanDigits = `252${selectedCarrier.prefix || ""}${clean}`;

  return {
    carrierCode: selectedCarrier.code,
    carrierName: selectedCarrier.name,
    subscriberNumber: clean,
    fullFormatted,
    cleanDigits,
  };
};
