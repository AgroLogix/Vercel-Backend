import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    providerId: { type: String, required: true }, // userId of provider
    vehicleType: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    year: { type: Number, required: true },
    fuelType: { type: String, required: true },
    ratePerKm: { type: Number, required: true },
     pricePerKg: { type: Number, default: 5 }, // ✅ new field
    baseLocation: { type: String, required: true },
     rating: { type: Number, default: 4.5 }, // ✅ new field
    description: { type: String },
    vehicleImages: [{ type: String }], // image URLs
    rcFile: { type: String }, // RC file URL
    status: { type: String, default: "Available" },
    
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
