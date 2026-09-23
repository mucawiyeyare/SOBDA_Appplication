// Creates (or promotes) an admin account.
// Usage: node scripts/createAdmin.js <email> <password> [name]
// Runs against the database in backend/.env (MONGO_URL), so check which one that is first.
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import User from "../models/usermodel.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const [email, password, name = "System Administrator"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/createAdmin.js <email> <password> [name]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Use a password of at least 8 characters.");
  process.exit(1);
}

const uri = process.env.MONGO_URL || process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URL is missing in backend/.env");
  process.exit(1);
}

await mongoose.connect(uri);
const normalizedEmail = email.trim().toLowerCase();
const hashed = await bcrypt.hash(password, 10);

const existing = await User.findOne({ email: normalizedEmail });
if (existing) {
  existing.role = "admin";
  existing.password = hashed;
  existing.isApproved = true;
  await existing.save();
  console.log(`Updated existing user ${normalizedEmail} -> admin (password reset).`);
} else {
  await User.create({
    name,
    email: normalizedEmail,
    password: hashed,
    // phone is required and unique; use a placeholder you can change in Profile later
    phone: `admin-${Date.now()}`,
    location: "Banaadir",
    role: "admin",
    isApproved: true,
  });
  console.log(`Created admin ${normalizedEmail}.`);
}

await mongoose.disconnect();
