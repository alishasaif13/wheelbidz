import fs from "fs/promises";
import path from "path";
import fsSync from "fs";

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function convertToBase64(imagePath) {
  try {
    const fullPath = path.resolve(imagePath);
    if (!fsSync.existsSync(fullPath)) return null;

    const buffer = await fs.readFile(fullPath);
    const mimeType = getMimeType(imagePath);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn(`Image load failed: ${imagePath}`, err.message);
    return null;
  }
}

export async function imageToBase64(input) {
  try {
    if (!input) return null;

    let imagePaths = [];

    if (typeof input === "string" && input.trim().startsWith("[")) {
      imagePaths = JSON.parse(input);
    } else if (typeof input === "string" && input.includes(",")) {
      imagePaths = input.split(",");
    } else {
      // Single image path
      const singleImage = await convertToBase64(input.trim());
      return singleImage;
    }

    const results = await Promise.all(
      imagePaths.map((imgPath) => convertToBase64(imgPath.trim()))
    );

    return results.filter(Boolean);
  } catch (err) {
    console.error("Failed to convert image(s) to base64:", err.message);
    return null;
  }
}
