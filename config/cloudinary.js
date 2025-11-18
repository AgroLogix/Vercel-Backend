// import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import multer from 'multer';
// import dotenv from 'dotenv';

// dotenv.config();

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Storage for Profile Pictures
// export const profileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'atlms/profiles',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
//     transformation: [{ width: 500, height: 500, crop: 'limit' }],
//   },
// });

// // Storage for Vehicle Images
// export const vehicleImageStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'atlms/vehicles/images',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
//     transformation: [{ width: 1200, height: 800, crop: 'limit' }],
//   },
// });

// // Storage for RC Files (PDFs)
// export const rcFileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'atlms/vehicles/documents',
//     allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
//     resource_type: 'auto',
//   },
// });

// // Export multer instances
// export const profileUpload = multer({ storage: profileStorage });
// export const vehicleImageUpload = multer({ storage: vehicleImageStorage });
// export const rcFileUpload = multer({ storage: rcFileStorage });

// export default cloudinary;

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage (required for Vercel)
export const upload = multer({ storage: multer.memoryStorage() });

// Upload buffer to Cloudinary (generic function)
export const uploadToCloudinary = (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default cloudinary;

