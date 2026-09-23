import jwt from "jsonwebtoken";
import User from "../models/usermodel.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

//  Only Admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

//  Admin or Hospital
export const adminOrHospital = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "hospital")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins and Hospitals only." });
  }
};

//  Health Institution or Admin (For National Reporting and Health Audits)
export const healthInstitutionOrAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" ||
      req.user.role === "health_institution" ||
      req.user.role === "hospital")
  ) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Health Institutions, Hospitals, and Admins only." });
  }
};

//  Admin or Health Institution (Ministry)
export const adminOrHealthInstitution = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "health_institution")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins and Health Institutions only." });
  }
};

//  Admin, Hospital, or Health Institution
export const adminOrHospitalOrHealthInstitution = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "hospital" || req.user.role === "health_institution")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins, Hospitals, and Health Institutions only." });
  }
};
