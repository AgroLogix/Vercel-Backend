// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import Vehicle from "../models/Vehicle.js";

// const router = express.Router();

// // Ensure upload directory exists
// const uploadDir = "uploads/vehicles";
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// // Multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${file.originalname}`;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });

// /* ============================================================
//    🧾 ADD VEHICLE
// ============================================================ */
// router.post(
//   "/add",
//   upload.fields([
//     { name: "vehicleImages", maxCount: 5 },
//     { name: "rcFile", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       const {
//         providerId,
//         vehicleType,
//         brand,
//         model,
//         registrationNumber,
//         capacity,
//         year,
//         fuelType,
//         ratePerKm,
//         baseLocation,
//         description,
//         pricePerKg, // ✅ optional new field
//         rating,     // ✅ optional new field
//       } = req.body;

//       const vehicleImages = req.files["vehicleImages"]
//         ? req.files["vehicleImages"].map(
//             (f) => `/uploads/vehicles/${f.filename}`
//           )
//         : [];

//       const rcFile = req.files["rcFile"]
//         ? `/uploads/vehicles/${req.files["rcFile"][0].filename}`
//         : "";

//       const newVehicle = new Vehicle({
//         providerId,
//         vehicleType,
//         brand,
//         model,
//         registrationNumber,
//         capacity,
//         year,
//         fuelType,
//         ratePerKm,
//         baseLocation,
//         description,
//         vehicleImages,
//         rcFile,
//         pricePerKg: pricePerKg || 5, // ✅ default value
//         rating: rating || 4.5,       // ✅ default value
//         status: "Available",
//       });

//       await newVehicle.save();
//       res
//         .status(201)
//         .json({ message: "Vehicle added successfully", vehicle: newVehicle });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Error adding vehicle" });
//     }
//   }
// );

// /* ============================================================
//    🚜 GET ALL AVAILABLE VEHICLES (For FarmerDashboard)
// ============================================================ */
// router.get("/", async (req, res) => {
//   try {
//     const vehicles = await Vehicle.find({ status: "Available" });
//     res.json(vehicles);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching available vehicles" });
//   }
// });

// /* ============================================================
//    🚚 GET VEHICLES BY PROVIDER
// ============================================================ */
// router.get("/:providerId", async (req, res) => {
//   try {
//     const { providerId } = req.params;
//     const vehicles = await Vehicle.find({ providerId });
//     res.json(vehicles);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching vehicles" });
//   }
// });

// /* ============================================================
//    ⚙️ UPDATE VEHICLE STATUS (Available ↔ Maintenance)
// ============================================================ */
// router.put("/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body; // expected: "Available" or "Maintenance"
//     const vehicle = await Vehicle.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!vehicle)
//       return res.status(404).json({ message: "Vehicle not found" });

//     res.json({ message: "Status updated", vehicle });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error updating vehicle status" });
//   }
// });

// /* ============================================================
//    ❌ DELETE VEHICLE (AND REMOVE IMAGES + RC)
// ============================================================ */
// router.delete("/:id", async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle)
//       return res.status(404).json({ message: "Vehicle not found" });

//     // Delete all vehicle images
//     if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
//       vehicle.vehicleImages.forEach((imgPath) => {
//         const filePath = path.join(process.cwd(), imgPath);
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//       });
//     }

//     // Delete RC file
//     if (vehicle.rcFile) {
//       const rcPath = path.join(process.cwd(), vehicle.rcFile);
//       if (fs.existsSync(rcPath)) fs.unlinkSync(rcPath);
//     }

//     // Delete record from DB
//     await Vehicle.findByIdAndDelete(req.params.id);

//     res.json({ message: "Vehicle deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error deleting vehicle" });
//   }
// });

// export default router;



// import express from "express";
// import Vehicle from "../models/Vehicle.js";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import {
//   vehicleImageStorage,
//   rcFileStorage,
// } from "../config/cloudinary.js";

// const router = express.Router();

// /* ============================================================
//    ✅ CLOUDINARY UPLOAD (Your Existing Code)
// ============================================================ */
// const upload = multer({
//   storage: multer({
//     storage: vehicleImageStorage,
//   }).any().storage,
// });

// // ✅ Better approach: Use separate uploads
// const uploadFields = multer({
//   storage: multer.diskStorage({}),
// }).fields([
//   { name: "vehicleImages", maxCount: 5 },
//   { name: "rcFile", maxCount: 1 },
// ]);

// // Create specialized uploaders
// const vehicleImageUpload = multer({ storage: vehicleImageStorage });
// const rcUpload = multer({ storage: rcFileStorage });

// /* ============================================================
//    🧾 ADD VEHICLE (Cloudinary)
// ============================================================ */
// router.post(
//   "/add",
//   (req, res, next) => {
//     const uploadHandler = multer({
//       storage: multer.diskStorage({}),
//     }).fields([
//       { name: "vehicleImages", maxCount: 5 },
//       { name: "rcFile", maxCount: 1 },
//     ]);

//     uploadHandler(req, res, async (err) => {
//       if (err) {
//         return res.status(400).json({ message: "File upload error" });
//       }

//       try {
//         const cloudinary = (await import("../config/cloudinary.js")).default;

//         const {
//           providerId,
//           vehicleType,
//           brand,
//           model,
//           registrationNumber,
//           capacity,
//           year,
//           fuelType,
//           ratePerKm,
//           baseLocation,
//           description,
//           pricePerKg,
//           rating,
//         } = req.body;

//         // ✅ Upload vehicle images to Cloudinary
//         const vehicleImages = [];
//         if (req.files["vehicleImages"]) {
//           for (const file of req.files["vehicleImages"]) {
//             const result = await cloudinary.uploader.upload(file.path, {
//               folder: "atlms/vehicles/images",
//             });
//             vehicleImages.push(result.secure_url);
//           }
//         }

//         // ✅ Upload RC file to Cloudinary
//         let rcFile = "";
//         if (req.files["rcFile"] && req.files["rcFile"][0]) {
//           const result = await cloudinary.uploader.upload(
//             req.files["rcFile"][0].path,
//             {
//               folder: "atlms/vehicles/documents",
//               resource_type: "auto", // Supports PDFs
//             }
//           );
//           rcFile = result.secure_url;
//         }

//         const newVehicle = new Vehicle({
//           providerId,
//           vehicleType,
//           brand,
//           model,
//           registrationNumber,
//           capacity,
//           year,
//           fuelType,
//           ratePerKm,
//           baseLocation,
//           description,
//           vehicleImages,
//           rcFile,
//           pricePerKg: pricePerKg || 5,
//           rating: rating || 4.5,
//           status: "Available",
//         });

//         await newVehicle.save();
//         res.status(201).json({
//           message: "Vehicle added successfully",
//           vehicle: newVehicle,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Error adding vehicle" });
//       }
//     });
//   }
// );

// /* ============================================================
//    🚜 GET ALL AVAILABLE VEHICLES (For FarmerDashboard)
// ============================================================ */
// router.get("/", async (req, res) => {
//   try {
//     const vehicles = await Vehicle.find({ status: "Available" });
//     res.json(vehicles);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching available vehicles" });
//   }
// });

// /* ============================================================
//    🚚 GET VEHICLES BY PROVIDER
// ============================================================ */
// router.get("/:providerId", async (req, res) => {
//   try {
//     const { providerId } = req.params;
//     const vehicles = await Vehicle.find({ providerId });
//     res.json(vehicles);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching vehicles" });
//   }
// });

// /* ============================================================
//    ⚙️ UPDATE VEHICLE STATUS (Available ↔ Maintenance)
// ============================================================ */
// router.put("/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;
//     const vehicle = await Vehicle.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!vehicle)
//       return res.status(404).json({ message: "Vehicle not found" });

//     res.json({ message: "Status updated", vehicle });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error updating vehicle status" });
//   }
// });

// /* ============================================================
//    ❌ DELETE VEHICLE (AND REMOVE LOCAL FILES IF EXIST)
// ============================================================ */
// router.delete("/:id", async (req, res) => {
//   try {
//     const vehicle = await Vehicle.findById(req.params.id);
//     if (!vehicle)
//       return res.status(404).json({ message: "Vehicle not found" });

//     // Cleanup only if local file paths exist
//     if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
//       vehicle.vehicleImages.forEach((imgPath) => {
//         const filePath = path.join(process.cwd(), imgPath);
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//       });
//     }

//     if (vehicle.rcFile) {
//       const rcPath = path.join(process.cwd(), vehicle.rcFile);
//       if (fs.existsSync(rcPath)) fs.unlinkSync(rcPath);
//     }

//     await Vehicle.findByIdAndDelete(req.params.id);

//     res.json({ message: "Vehicle deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error deleting vehicle" });
//   }
// });

// export default router;


import express from "express";
import Vehicle from "../models/Vehicle.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import {
  vehicleImageStorage,
  rcFileStorage,
} from "../config/cloudinary.js";

const router = express.Router();

/* ============================================================
   ✅ CLOUDINARY UPLOAD (Your Existing Code)
============================================================ */
const upload = multer({
  storage: multer({
    storage: vehicleImageStorage,
  }).any().storage,
});

// ✅ Better approach: Use separate uploads
const uploadFields = multer({
  storage: multer.diskStorage({}),
}).fields([
  { name: "vehicleImages", maxCount: 5 },
  { name: "rcFile", maxCount: 1 },
]);

// Create specialized uploaders
const vehicleImageUpload = multer({ storage: vehicleImageStorage });
const rcUpload = multer({ storage: rcFileStorage });

/* ============================================================
   🧾 ADD VEHICLE (Cloudinary)
============================================================ */
router.post(
  "/add",
  (req, res, next) => {
    const uploadHandler = multer({
      storage: multer.diskStorage({}),
    }).fields([
      { name: "vehicleImages", maxCount: 5 },
      { name: "rcFile", maxCount: 1 },
    ]);

    uploadHandler(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "File upload error" });
      }

      try {
        const cloudinary = (await import("../config/cloudinary.js")).default;

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
          pricePerKg,
          rating,
        } = req.body;

        // ✅ Upload vehicle images to Cloudinary
        const vehicleImages = [];
        if (req.files["vehicleImages"]) {
          for (const file of req.files["vehicleImages"]) {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "atlms/vehicles/images",
            });
            vehicleImages.push(result.secure_url);
          }
        }

        // ✅ Upload RC file to Cloudinary
        let rcFile = "";
        if (req.files["rcFile"] && req.files["rcFile"][0]) {
          const result = await cloudinary.uploader.upload(
            req.files["rcFile"][0].path,
            {
              folder: "atlms/vehicles/documents",
              resource_type: "auto", // Supports PDFs
            }
          );
          rcFile = result.secure_url;
        }

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
          pricePerKg: pricePerKg || 5,
          rating: rating || 4.5,
          status: "Available",
        });

        await newVehicle.save();
        res.status(201).json({
          message: "Vehicle added successfully",
          vehicle: newVehicle,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding vehicle" });
      }
    });
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
    const { status } = req.body;
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
   ❌ DELETE VEHICLE (AND REMOVE LOCAL FILES IF EXIST)
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    // Cleanup only if local file paths exist
    if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
      vehicle.vehicleImages.forEach((imgPath) => {
        const filePath = path.join(process.cwd(), imgPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    if (vehicle.rcFile) {
      const rcPath = path.join(process.cwd(), vehicle.rcFile);
      if (fs.existsSync(rcPath)) fs.unlinkSync(rcPath);
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

/* ============================================================
   🧾 ADD VEHICLE (MEMORY STORAGE + CLOUDINARY UPLOAD)
   (NEW ADDITION - does not modify existing /add)
============================================================ */
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage });

router.post(
  "/add-memory",
  memoryUpload.fields([
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
        pricePerKg,
        rating,
      } = req.body;

      const vehicleImages = [];
      if (req.files["vehicleImages"]) {
        for (const file of req.files["vehicleImages"]) {
          const b64 = Buffer.from(file.buffer).toString("base64");
          const dataURI = `data:${file.mimetype};base64,${b64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: "atlms/vehicles/images",
            resource_type: "auto",
          });
          vehicleImages.push(result.secure_url);
        }
      }

      let rcFile = "";
      if (req.files["rcFile"] && req.files["rcFile"][0]) {
        const file = req.files["rcFile"][0];
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "atlms/vehicles/documents",
          resource_type: "auto",
        });
        rcFile = result.secure_url;
      }

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
        pricePerKg: pricePerKg || 5,
        rating: rating || 4.5,
        status: "Available",
      });

      await newVehicle.save();
      res.status(201).json({
        message: "Vehicle added successfully (memory version)",
        vehicle: newVehicle,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding vehicle" });
    }
  }
);

/* ============================================================
   ❌ DELETE VEHICLE (CLOUDINARY DELETE VERSION)
============================================================ */
router.delete("/cloudinary/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // ✅ Delete vehicle images from Cloudinary
    if (vehicle.vehicleImages && vehicle.vehicleImages.length > 0) {
      for (const imageUrl of vehicle.vehicleImages) {
        const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(`atlms/vehicles/images/${publicId}`);
      }
    }

    // ✅ Delete RC file from Cloudinary
    if (vehicle.rcFile) {
      const publicId = vehicle.rcFile.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(`atlms/vehicles/documents/${publicId}`, {
        resource_type: "raw",
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: "Vehicle deleted successfully (Cloudinary)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting vehicle from Cloudinary" });
  }
});

export default router;


