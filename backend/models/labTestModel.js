import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    bloodUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodUnit",
      required: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },
    testDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    testedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bloodGrouping: {
      ABO: {
        type: String,
        enum: ["A", "B", "AB", "O"],
        required: true,
      },
      Rh: {
        type: String,
        enum: ["+", "-"],
        required: true,
      },
      confirmed: {
        type: Boolean,
        default: false,
      },
    },
    ttiScreening: {
      // Transfusion Transmitted Infections
      HIV: {
        result: { type: String, enum: ["Negative", "Positive", "Pending"], default: "Pending" },
        method: String,
      },
      HBV: {
        // Hepatitis B
        result: { type: String, enum: ["Negative", "Positive", "Pending"], default: "Pending" },
        method: String,
      },
      HCV: {
        // Hepatitis C
        result: { type: String, enum: ["Negative", "Positive", "Pending"], default: "Pending" },
        method: String,
      },
      Syphilis: {
        result: { type: String, enum: ["Negative", "Positive", "Pending"], default: "Pending" },
        method: String,
      },
      Malaria: {
        result: { type: String, enum: ["Negative", "Positive", "Pending"], default: "Pending" },
        method: String,
      },
    },
    overallResult: {
      type: String,
      enum: ["Safe", "Unsafe", "Pending"],
      default: "Pending",
    },
    remarks: {
      type: String,
      required: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approvalDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

// Auto-calculate overall result
labTestSchema.pre("save", function (next) {
  const tests = this.ttiScreening;
  const allNegative = Object.values(tests).every(
    (test) => test.result === "Negative"
  );
  const anyPositive = Object.values(tests).some(
    (test) => test.result === "Positive"
  );

  if (anyPositive) {
    this.overallResult = "Unsafe";
  } else if (allNegative && this.bloodGrouping.confirmed) {
    this.overallResult = "Safe";
  } else {
    this.overallResult = "Pending";
  }
  next();
});

export default mongoose.model("LabTest", labTestSchema);
