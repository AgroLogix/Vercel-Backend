import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import fs from "fs";
// import { profileUpload } from "../config/cloudinary.js";

import { upload, uploadToCloudinary } from "../config/cloudinary.js";


const router = express.Router();


// ================================
// 📂 Multer Configuration
// ================================
// const uploadDir = "uploads";
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${file.originalname}`;
//     cb(null, uniqueName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif/;
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (allowedTypes.test(ext)) cb(null, true);
//   else cb(new Error("Only image files allowed"), false);
// };

// const upload = multer({ storage, fileFilter });




// ================================
// 🧾 Signup
// ================================
router.post("/Signup", async (req, res) => {
  try {
    const { firstName, lastName, userId, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      userId,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================================
// 🔐 Login with Role Validation
// ================================
router.post("/login", async (req, res) => {
  try {
    const { loginId, password, role } = req.body;

    // 1️⃣ Check role selection
    if (!role) {
      return res.status(400).json({ message: "Please select your role before logging in" });
    }

    // 2️⃣ Find user by email or userId
    const user =
      (await User.findOne({ email: loginId })) ||
      (await User.findOne({ userId: loginId }));

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3️⃣ Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 4️⃣ Validate role matches the user’s registered role
    if (user.role !== role) {
      return res.status(400).json({
        message: `You are registered as a ${user.role}. Please select the correct role.`,
      });
    }

    // 5️⃣ Login success
    res.status(200).json({
      message: "Login successful",
      user: {
        userId: user.userId,
        firstName: user.firstName,
        role: user.role,
        email: user.email,
        profilePic: user.profilePic || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



// ================================
// ✏️ Update Provider Profile
// ================================
router.put("/provider/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: req.body },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================================
// 👤 Get Provider Profile
// ================================
router.get("/provider/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================================
// 🖼️ Upload Provider Profile Picture
// ================================
// router.post("/provider/:userId/upload", upload.single("profilePic"), async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!req.file) return res.status(400).json({ message: "No image uploaded" });

//     const imagePath = `/uploads/${req.file.filename}`;

//     const updatedUser = await User.findOneAndUpdate(
//       { userId },
//       { profilePic: imagePath },
//       { new: true }
//     );

//     res.json({ message: "Image uploaded", profilePic: imagePath, user: updatedUser });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Upload failed" });
//   }
// });

// ================================
// 🖼️ Upload Provider Profile Picture (UPDATED FOR CLOUDINARY)
// ================================
// router.post(
//   "/provider/:userId/upload",
//   profileUpload.single("profilePic"), // ✅ Using Cloudinary storage
//   async (req, res) => {
//     try {
//       const { userId } = req.params;
      
//       if (!req.file) {
//         return res.status(400).json({ message: "No image uploaded" });
//       }

//       // ✅ Cloudinary automatically provides the full URL
//       const imagePath = req.file.path; // This is the Cloudinary URL

//       const updatedUser = await User.findOneAndUpdate(
//         { userId },
//         { profilePic: imagePath },
//         { new: true }
//       );

//       res.json({
//         message: "Image uploaded",
//         profilePic: imagePath,
//         user: updatedUser,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Upload failed" });
//     }
//   }
// );

router.post(
  "/provider/:userId/upload",
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Upload buffer to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        "atlms/profiles"
      );

      const imageURL = cloudinaryResult.secure_url;

      // Save URL to DB
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        { profilePic: imageURL },
        { new: true }
      );

      res.json({
        message: "Image uploaded",
        profilePic: imageURL,
        user: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


// ================================
// ✏️ Update Farmer Profile
// ================================
router.put("/farmer/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: req.body },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Farmer profile updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================================
// 👤 Get Farmer Profile
// ================================
router.get("/farmer/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
