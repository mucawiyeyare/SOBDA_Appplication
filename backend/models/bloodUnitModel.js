import mongoose from "mongoose";

const bloodUnitSchema = new mongoose.Schema(
  {
    unitNumber: {
      type: String,
      required: true,
      unique: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    component: {
      type: String,
      enum: ["Whole Blood", "RBC", "Plasma", "Platelets", "Cryoprecipitate", "FFP"],
      required: true,
      default: "Whole Blood",
    },
    volume: {
      type: Number, // in ml
      required: true,
    },
    collectionDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Collected", "Testing", "Available", "Reserved", "Issued", "Expired", "Discarded"],
      default: "Collected",
    },
    location: {
      type: String, // Storage location in blood bank
      required: false,
    },
    testResults: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
      required: false,
    },
    issuedTo: {
      hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      issuedDate: Date,
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    discardReason: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Generate barcode before saving
bloodUnitSchema.pre("save", async function (next) {
  if (!this.barcode) {
    this.barcode = `BB${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model("BloodUnit", bloodUnitSchema);
