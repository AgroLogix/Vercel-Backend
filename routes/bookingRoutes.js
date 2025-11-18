// import express from "express";
// import Booking from "../models/Booking.js";
// import Vehicle from "../models/Vehicle.js";
// import User from "../models/User.js";
// import mongoose from "mongoose";

// const router = express.Router();

// /* 🧾 CREATE BOOKING WITH VALIDATION */
// router.post("/add", async (req, res) => {
//   try {
//     const { vehicleId, deliveryDate, farmerId } = req.body;

//     // ✅ Check if vehicle exists
//     const vehicle = await Vehicle.findById(vehicleId);
//     if (!vehicle) {
//       return res.status(404).json({ message: "Vehicle not found" });
//     }

//     // ✅ Check if vehicle is available (not in maintenance)
//     if (vehicle.status !== "Available") {
//       return res
//         .status(400)
//         .json({ message: "This vehicle is currently not available for booking" });
//     }

//     // ✅ Check if vehicle is already booked for this date
//     const existingBooking = await Booking.findOne({
//       vehicleId,
//       deliveryDate,
//       status: { $in: ["Pending", "Accepted"] },
//     });

//     if (existingBooking) {
//       return res.status(400).json({
//         message:
//           "This vehicle is already booked for the selected date. Please choose another date or vehicle.",
//         bookedBy: existingBooking.farmerId === farmerId ? "you" : "another farmer",
//       });
//     }

//     // ✅ Generate unique booking ID
//     const bookingData = {
//       ...req.body,
//       userId: new mongoose.Types.ObjectId().toString(),
//     };

//     const booking = new Booking(bookingData);
//     await booking.save();

//     res.status(201).json({
//       message: "Booking created successfully! Waiting for provider confirmation.",
//       booking,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error creating booking", error: err.message });
//   }
// });

// /* 🚜 GET BOOKINGS FOR PROVIDER - WITH POPULATED FARMER DATA */
// router.get("/provider/:providerId", async (req, res) => {
//   try {
//     const bookings = await Booking.find({ providerId: req.params.providerId }).sort({
//       createdAt: -1,
//     });

//     const populatedBookings = await Promise.all(
//       bookings.map(async (booking) => {
//         const farmer = await User.findOne({ userId: booking.farmerId });
//         return {
//           ...booking.toObject(),
//           farmerDetails: farmer
//             ? {
//                 name: `${farmer.firstName} ${farmer.lastName}`,
//                 phone: farmer.phone,
//                 email: farmer.email,
//               }
//             : null,
//         };
//       })
//     );

//     res.json(populatedBookings);
//   } catch (err) {
//     console.error("Error fetching provider bookings:", err);
//     res.status(500).json({ message: "Error fetching provider bookings" });
//   }
// });

// /* 🌾 GET BOOKINGS FOR FARMER (POPULATED WITH VEHICLE + PROVIDER INFO) */
// router.get("/farmer/:farmerId", async (req, res) => {
//   try {
//     const bookings = await Booking.find({ farmerId: req.params.farmerId })
//       .populate("vehicleId")
//       .populate("providerId")
//       .sort({ createdAt: -1 });

//     const populatedBookings = await Promise.all(
//       bookings.map(async (booking) => {
//         const vehicle = await Vehicle.findById(booking.vehicleId);
//         const provider = await User.findOne({ userId: booking.providerId });

//         return {
//           ...booking.toObject(),
//           vehicleDetails: vehicle
//             ? {
//                 registrationNumber: vehicle.registrationNumber,
//                 brand: vehicle.brand,
//                 model: vehicle.model,
//                 vehicleType: vehicle.vehicleType,
//                 capacity: vehicle.capacity,
//               }
//             : null,
//           providerDetails: provider
//             ? {
//                 name: `${provider.firstName} ${provider.lastName}`,
//                 phone: provider.phone,
//                 email: provider.email,
//               }
//             : null,
//         };
//       })
//     );

//     res.json(populatedBookings);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error fetching farmer bookings", error: err.message });
//   }
// });

// /* ✅ UPDATE BOOKING STATUS (Accept/Reject/Complete/Cancel) */
// router.put("/:id/status", async (req, res) => {
//   try {
//     const { status } = req.body;
//     const validStatuses = ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: "Invalid status value" });
//     }

//     const booking = await Booking.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     res.json({ message: `Booking ${status.toLowerCase()} successfully`, booking });
//   } catch (err) {
//     res.status(500).json({ message: "Error updating booking status", error: err.message });
//   }
// });

// /* 🔍 CHECK VEHICLE AVAILABILITY */
// router.get("/check-availability/:vehicleId/:date", async (req, res) => {
//   try {
//     const { vehicleId, date } = req.params;

//     const existingBooking = await Booking.findOne({
//       vehicleId,
//       deliveryDate: date,
//       status: { $in: ["Pending", "Accepted"] },
//     });

//     res.json({
//       available: !existingBooking,
//       message: existingBooking
//         ? "Vehicle already booked for this date"
//         : "Vehicle is available",
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Error checking availability", error: err.message });
//   }
// });

// /* ✅ Cancel a booking by ID */
// router.put("/cancel/:bookingId", async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (booking.status !== "Pending") {
//       return res.status(400).json({ message: "Only pending requests can be cancelled" });
//     }

//     booking.status = "Cancelled";
//     await booking.save();

//     res.status(200).json({ message: "Booking cancelled successfully", booking });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// /* ✅ NEW: MARK BOOKING AS DELIVERED */
// router.put("/deliver/:bookingId", async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const booking = await Booking.findById(bookingId);

//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     booking.status = "Delivered";
//     await booking.save();

//     res.json({ message: "Delivery marked as completed", booking });
//   } catch (err) {
//     console.error("❌ Error in /deliver route:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// export default router;


import express from "express";
import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

/* 🧾 CREATE BOOKING WITH VALIDATION */
router.post("/add", async (req, res) => {
  try {
    const { vehicleId, deliveryDate, farmerId, providerId } = req.body;

    // Check vehicle existence
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check availability
    if (vehicle.status !== "Available") {
      return res.status(400).json({
        message: "This vehicle is not available for booking",
      });
    }

    // Check duplicate booking
    const existingBooking = await Booking.findOne({
      vehicleId,
      deliveryDate,
      status: { $in: ["Pending", "Accepted"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Vehicle already booked for this date",
        bookedBy: existingBooking.farmerId === farmerId ? "you" : "another farmer",
      });
    }

    // FINAL BOOKING DATA
    const bookingData = {
      ...req.body,
      userId: farmerId, // 🔥 FIXED — use actual farmerId
    };

    const booking = new Booking(bookingData);
    await booking.save();

    res.status(201).json({
      message: "Booking created successfully! Waiting for provider confirmation.",
      booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating booking", error: err.message });
  }
});

/* 🚜 PROVIDER BOOKINGS */
router.get("/provider/:providerId", async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 });

    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const farmer = await User.findOne({ userId: booking.farmerId });

        return {
          ...booking.toObject(),
          farmerDetails: farmer
            ? {
                name: `${farmer.firstName} ${farmer.lastName}`,
                phone: farmer.phone,
                email: farmer.email,
              }
            : null,
        };
      })
    );

    res.json(populatedBookings);
  } catch (err) {
    console.error("Error fetching provider bookings:", err);
    res.status(500).json({ message: "Error fetching provider bookings" });
  }
});

/* 🌾 FARMER BOOKINGS */
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const bookings = await Booking.find({ farmerId: req.params.farmerId })
      .populate("vehicleId")
      .sort({ createdAt: -1 });

    const populatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await Vehicle.findById(booking.vehicleId);
        const provider = await User.findOne({ userId: booking.providerId });

        return {
          ...booking.toObject(),
          vehicleDetails: vehicle
            ? {
                registrationNumber: vehicle.registrationNumber,
                brand: vehicle.brand,
                model: vehicle.model,
                vehicleType: vehicle.vehicleType,
                capacity: vehicle.capacity,
              }
            : null,
          providerDetails: provider
            ? {
                name: `${provider.firstName} ${provider.lastName}`,
                phone: provider.phone,
                email: provider.email,
              }
            : null,
        };
      })
    );

    res.json(populatedBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching farmer bookings", error: err.message });
  }
});

/* UPDATE BOOKING STATUS */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      message: `Booking ${status.toLowerCase()} successfully`,
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating booking status", error: err.message });
  }
});

/* CHECK AVAILABILITY */
router.get("/check-availability/:vehicleId/:date", async (req, res) => {
  try {
    const { vehicleId, date } = req.params;

    const existingBooking = await Booking.findOne({
      vehicleId,
      deliveryDate: date,
      status: { $in: ["Pending", "Accepted"] },
    });

    res.json({
      available: !existingBooking,
      message: existingBooking
        ? "Vehicle already booked for this date"
        : "Vehicle is available",
    });
  } catch (err) {
    res.status(500).json({ message: "Error checking availability", error: err.message });
  }
});

/* CANCEL BOOKING */
router.put("/cancel/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending requests can be cancelled",
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/* MARK AS DELIVERED */
router.put("/deliver/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    booking.status = "Delivered";
    await booking.save();

    res.json({
      message: "Delivery marked as completed",
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
