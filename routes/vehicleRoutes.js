import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Vehicle from "../models/Vehicle.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "uploads/vehicles";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ============================================================
   🧾 ADD VEHICLE
============================================================ */
router.post(
  "/add",
  upload.fields([
    { name: "vehicleImages", maxCount: 5 },
    { name: "rcFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        providerId,
        vehicleType,
        brand,
        model,
        registrationNumber,
        capacity,
        year,
        fuelType,
        ratePerKm,
        baseLocation,
        description,
        pricePerKg, // ✅ optional new field
        rating,     // ✅ optional new field
      } = req.body;

      const vehicleImages = req.files["vehicleImages"]
        ? req.files["vehicleImages"].map(
            (f) => `/uploads/vehicles/${f.filename}`
          )
        : [];

      const rcFile = req.files["rcFile"]
        ? `/uploads/vehicles/${req.files["rcFile"][0].filename}`
        : "";

      const newVehicle = new Vehicle({
        providerId,
        vehicleType,
        brand,
        model,
        registrationNumber,
        capacity,
        year,
        fuelType,
        ratePerKm,
        baseLocation,
        description,
        vehicleImages,
        rcFile,
        pricePerKg: pricePerKg || 5, // ✅ default value
        rating: rating || 4.5,       // ✅ default value
        status: "Available",
      });

      await newVehicle.save();
      res
        .status(201)
        .json({ message: "Vehicle added successfully", vehicle: newVehicle });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding vehicle" });
    }
  }
);

/* ============================================================
   🚜 GET ALL AVAILABLE VEHICLES (For FarmerDashboard)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: "Available" });
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching available vehicles" });
  }
});

/* ============================================================
   🚚 GET VEHICLES BY PROVIDER
============================================================ */
router.get("/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    const vehicles = await Vehicle.find({ providerId });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicles" });
  }
});

/* ============================================================
   ⚙️ UPDATE VEHICLE STATUS (Available ↔ Maintenance)
============================================================ */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // expected: "Available" or "Maintenance"
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    res.json({ message: "Status updated", vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating vehicle status" });
  }
});

/* ============================================================
   ❌ DELETE VEHICLE (AND REMOVE IMAGES + RC)
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    // Delete all vehicle images
    if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
      vehicle.vehicleImages.forEach((imgPath) => {
        const filePath = path.join(process.cwd(), imgPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    // Delete RC file
    if (vehicle.rcFile) {
      const rcPath = path.join(process.cwd(), vehicle.rcFile);
      if (fs.existsSync(rcPath)) fs.unlinkSync(rcPath);
    }

    // Delete record from DB
    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

export default router;
