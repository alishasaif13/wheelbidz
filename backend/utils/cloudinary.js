import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "skillmorph-files",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

//  3. Manual Upload using path (used in your controller)
const uploadPhoto = async (filePath, folder = 'vehicle_photos') => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });
    return result; // result includes public_id, secure_url, etc.
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

//  4. Generate URL with transformation options
const getPhotoUrl = (publicId, options = {}) => {
  return cloudinary.v2.url(publicId, {
    transformation: [
      {
        width: options.width || 400,
        crop: options.crop || 'limit',
        quality: options.quality || 'auto',
      },
    ],
    secure: true,
  });
};


const deleteFileFromCloudinary = async (urlOrPublicId) => {
  try {
    let publicId = urlOrPublicId;

    // If a full URL is passed, extract public_id
    if (urlOrPublicId.startsWith('http')) {
      const urlParts = urlOrPublicId.split('/');
      const filePath = urlParts.slice(-2).join('/'); // folder/filename.ext
      publicId = filePath.split('.')[0]; // remove extension
    }

    const result = await cloudinary.v2.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

export { upload, uploadPhoto, getPhotoUrl, deleteFileFromCloudinary };
