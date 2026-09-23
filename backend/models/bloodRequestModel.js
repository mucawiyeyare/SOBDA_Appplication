import mongoose from "mongoose";

const bloodRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedBy: {
      name: { type: String, required: true },
      designation: String,
      contact: String,
    },
    patientDetails: {
      name: { type: String, required: true },
      age: Number,
      gender: { type: String, enum: ["Male", "Female", "Other"] },
      bloodType: {
        type: String,
        required: true,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      diagnosis: String,
      urgency: {
        type: String,
        enum: ["Routine", "Urgent", "Emergency"],
        default: "Routine",
      },
    },
    requestedUnits: [
      {
        component: {
          type: String,
          enum: ["Whole Blood", "RBC", "Plasma", "Platelets", "Cryoprecipitate", "FFP"],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        bloodType: {
          type: String,
          required: true,
          enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        },
      },
    ],
    requestDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requiredBy: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Partially Fulfilled", "Fulfilled", "Rejected", "Cancelled"],
      default: "Pending",
    },
    issuedUnits: [
      {
        bloodUnitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BloodUnit",
        },
        component: String,
        issuedDate: Date,
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approvalDate: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Generate request number before saving
bloodRequestSchema.pre("save", async function (next) {
  if (!this.requestNumber) {
    this.requestNumber = `REQ${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model("BloodRequest", bloodRequestSchema);
