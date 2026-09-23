// Show "Dr." once, whether or not it was typed into the doctor's name.
export const doctorDisplayName = (name = "") => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);

export const initialsOf = (name = "") =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
