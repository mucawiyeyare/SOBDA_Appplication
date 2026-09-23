import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URL or MONGO_URI environment variable is missing.");
    }
    await mongoose.connect(mongoUri);
    console.log("connected to MongoDB");
  } catch (err) {
    console.error(" MongoDB connection error:", err);
    process.exit(1); 
  }
};

export default connectDB;
