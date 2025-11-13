import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // ✅ ADD userId field to satisfy the MongoDB index
    userId: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(), // Generate unique ID for each booking
    },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    providerId: { type: String, required: true },
    vehicleId: { type: String, required: true },
    vehicleName: { type: String },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    deliveryDate: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected",
        "Completed",
        "Cancelled",
        "Delivered",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// ✅ Compound index to prevent duplicate bookings for same vehicle on same date
bookingSchema.index({ vehicleId: 1, deliveryDate: 1, status: 1 });

// ✅ Pre-save hook to ensure userId is always unique
bookingSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = new mongoose.Types.ObjectId().toString();
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);
