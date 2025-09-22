import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDb = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "event_booking",
    });
    console.log("DB Connection Successfully");
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw error;
  }
};