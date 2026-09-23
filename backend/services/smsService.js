

/**
 * Somali Telecom Carriers & Prefixes:
 * - Hormuud: 61, 77 (061, 077, +252 61, +252 77)
 * - Somtel: 62, 65, 66 (062, 065, 066, +252 62, +252 65, +252 66)
 */
export const identifySomaliCarrier = (phone) => {
  if (!phone) return { carrier: "Unknown", prefix: "", isSupported: false };
  let clean = phone.toString().replace(/\D/g, "");

  if (clean.startsWith("252")) {
    clean = clean.substring(3);
  }
  if (clean.startsWith("0")) {
    clean = clean.substring(1);
  }

  if (clean.startsWith("61") || clean.startsWith("77")) {
    return { carrier: "Hormuud", prefix: clean.substring(0, 2), isSupported: true, subscriber: clean };
  }
  if (clean.startsWith("62") || clean.startsWith("65") || clean.startsWith("66")) {
    return { carrier: "Somtel", prefix: clean.substring(0, 2), isSupported: true, subscriber: clean };
  }

  return { carrier: "Other", prefix: clean.substring(0, 2), isSupported: false, subscriber: clean };
};

/**
 * Format phone for Somali Telecom: `25261XXXXXXX`
 */
export const formatForSomaliSMS = (phone) => {
  if (!phone) return "";
  let clean = phone.toString().replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "252" + clean.substring(1);
  } else if (!clean.startsWith("252") && clean.length <= 9) {
    clean = "252" + clean;
  }
  return clean;
};

/**
 * Helper to build clear Somali Emergency Mobile SMS text
 */
export const buildEmergencySMSText = (donorName = "Walaal", hospitalName = "Isbitaalka", hospitalLocation = "Mogadishu", patientInfo = null) => {
  const dName = donorName || "Walaal";
  const hName = hospitalName || "Isbitaalka";
  const hLoc = hospitalLocation || "Mogadishu";

  let patientStr = "";
  if (patientInfo && patientInfo.name) {
    patientStr = ` Bukaanka: ${patientInfo.name}${patientInfo.diagnosis ? ` (${patientInfo.diagnosis})` : ""}.`;
  }

  return `Asc Wll ${dName}, waxaa loo baahan yahay dhiig-bixin degdeg ah ${hName} (${hLoc}).${patientStr} Fadlan hadaad awooddo nala soo xiriir ama kaalay isbitaalka. Caawintaadu waa badbaado nololeed. - SOBDA System`;
};

/**
 * Build SMS metadata for a donor (no external API call — SMS is handled via WhatsApp).
 *
 * @param {string} phone
 * @param {string} messageText
 */
export const sendDirectSMS = async (phone, messageText) => {
  const cleanedPhone = formatForSomaliSMS(phone);
  const carrierInfo = identifySomaliCarrier(phone);
  const nativeSmsUrl = `sms:${cleanedPhone}?body=${encodeURIComponent(messageText)}`;

  console.log(`[SMS] Prepared message for ${cleanedPhone} (${carrierInfo.carrier}) — delivered via WhatsApp.`);

  return {
    success: true,
    carrier: carrierInfo.carrier,
    isHormuudOrSomtel: carrierInfo.isSupported,
    formattedPhone: cleanedPhone,
    messageText,
    smsUrl: nativeSmsUrl,
    apiDelivered: false,
    apiDetails: null,
  };
};
