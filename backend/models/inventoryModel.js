import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    component: {
      type: String,
      enum: ["Whole Blood", "RBC", "Plasma", "Platelets", "Cryoprecipitate", "FFP"],
      required: true,
    },
    totalUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    issuedUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiredUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    discardedUnits: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumStock: {
      type: Number,
      default: 5,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Create compound index for unique blood type + component combination
inventorySchema.index({ bloodType: 1, component: 1 }, { unique: true });

export default mongoose.model("Inventory", inventorySchema);
