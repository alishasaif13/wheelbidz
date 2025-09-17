import multer from 'multer';
import path from 'path';
import * as fs from 'fs';

const uploadDir = 'uploads/vehicles/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

//  Correctly define upload middleware
export const uploadVehicleImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
}).fields([
  { name: 'image', maxCount: 25 }          
]);
