/**
 * Full Name Validation Utility
 *
 * Rules:
 * 1. Name is required (non-empty, non-whitespace).
 * 2. Must contain at least two words (First Name & Last Name).
 * 3. Letters, apostrophes, hyphens, and spaces only (No numbers or special symbols).
 * 4. Each name part must be at least 2 characters long.
 *
 * @param {string} name - The input full name
 * @returns {{ isValid: boolean, error: string }}
 */
export const validateFullName = (name) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return {
      isValid: false,
      error: "Full name is required.",
    };
  }

  const trimmed = name.trim();

  // Allow letters (including international/accented characters), single spaces, hyphens, and apostrophes
  const lettersAndSpacesRegex = /^[a-zA-Z\u00C0-\u024F\s'-]+$/;
  if (!lettersAndSpacesRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Full name must contain letters and spaces only (no numbers or special characters).",
    };
  }

  // Split into words by whitespace
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length < 2) {
    return {
      isValid: false,
      error: "Please enter both first name and last name (e.g. Ahmed Mohamed).",
    };
  }

  // Ensure each word is at least 2 letters
  const hasShortWords = words.some((w) => w.replace(/['-]/g, "").length < 2);
  if (hasShortWords) {
    return {
      isValid: false,
      error: "Each name part must contain at least 2 letters.",
    };
  }

  return {
    isValid: true,
    error: "",
  };
};

export default validateFullName;
