import pool from "../config/db.js";
import path from "path";
import { formatingPrice } from "../utils/priceUtils.js";
import fsSync from "fs";
import * as fs from "fs";
import { imageToBase64 } from "../utils/fileUtils.js";
import {
  uploadPhoto,
  getPhotoUrl,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";

export const checkVehicles = async (req, res) => {
  try {
    // --- STEP 1: Log files currently in the uploads directory ---
    const uploadDir = path.join(process.cwd(), "uploads/vehicles");
    console.log(`--- Checking files in: ${uploadDir} ---`);
    try {
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        if (files.length > 0) {
          console.log(`Files found in ${uploadDir}:`);
          files.forEach((file) => console.log(`  - ${file}`));
        } else {
          console.log(`Directory ${uploadDir} exists but is EMPTY.`);
        }
      } else {
        console.warn(`Directory ${uploadDir} DOES NOT EXIST on the server.`);
      }
    } catch (dirError) {
      console.error(`Error reading directory ${uploadDir}:`, dirError.message);
    }
    console.log(`--- End of directory check ---`);
    // --- END STEP 1 ---

    const [vehicles] = await pool.query(
      `SELECT * FROM tbl_vehicles WHERE vehicleStatus = 'Y'`
    );

    if (!vehicles || vehicles.length === 0) {
      return res.status(404).json({ message: "No active vehicles found." });
    }

    const vehiclesWithAbsoluteImagePaths = vehicles.map((vehicle) => {
      const processedVehicle = { ...vehicle };
      let absoluteImageUrls = []; // Will store paths that exist

      if (processedVehicle.image) {
        try {
          const imagePaths = JSON.parse(processedVehicle.image);
          if (Array.isArray(imagePaths)) {
            absoluteImageUrls = imagePaths.map((relativePath) => {
              const fullPath = path.join(process.cwd(), relativePath);

              // --- STEP 2: Check if the file actually exists on disk ---
              if (fs.existsSync(fullPath)) {
                return fullPath; // Return the path ONLY if the file exists
              } else {
                console.warn(
                  `[Missing File] Vehicle ID ${processedVehicle.id}: File NOT FOUND at: ${fullPath}`
                );
                return null; // Return null if file is missing
              }
              // --- END STEP 2 ---
            });
          } else {
            console.warn(
              `[JSON Parse] Vehicle ID ${processedVehicle.id}: 'image' field is not an array after JSON.parse. Value:`,
              processedVehicle.image
            );
          }
        } catch (e) {
          console.error(
            `[JSON Error] Failed to parse image JSON for vehicle ID ${processedVehicle.id}:`,
            e.message
          );
          absoluteImageUrls = [];
        }
      }

      // Filter out any nulls from missing files before assigning
      processedVehicle.absoluteImagePaths = absoluteImageUrls.filter(Boolean);
      // Optional: you might want to remove the 'image' field if it's no longer needed
      delete processedVehicle.image;

      return processedVehicle;
    });

    res.status(200).json(vehiclesWithAbsoluteImagePaths);
  } catch (error) {
    console.error("Failed to fetch Vehicles for check:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

export const addVehicle = async (req, res) => {
  const uploadedLocalFilePaths = [];

  try {
    const {
      userId,
      vin = " ",
      year,
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
      mileage,
      vehicleCondition,
      keysAvailable,
      locationId,
      saleStatus = "live",
      auctionDate,
      currentBid = 0.0,
      buyNowPrice,
      certifyStatus,
    } = req.body;

    // Normalize and validate VIN
    // const normalizedVin = vin?.trim().toUpperCase();
    // if (!normalizedVin || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(normalizedVin)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid or missing VIN (must be 17 alphanumeric characters)',
    //   });
    // }

    // Validate required fields
    // const requiredFields = ['year', 'make', 'model', 'vehicleCondition', 'locationId', 'userId'];
    // const missingFields = requiredFields.filter(field => !req.body[field]);
    // if (missingFields.length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Missing required fields: ${missingFields.join(', ')}`
    //   });
    // }

    // Check for existing vehicle
    // const [existingVehicle] = await pool.query(
    //   'SELECT id FROM tbl_vehicles WHERE vin = ?',
    //   [normalizedVin]
    // );
    // if (existingVehicle.length > 0) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'Vehicle with this VIN already exists'
    //   });
    // }

    // --- Cloudinary Image Uploads (NEW LOGIC) ---
    const imagePublicIds = [];
    const filesToUpload =
      req.files && req.files.image
        ? Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image]
        : [];

    const imagesToProcess = filesToUpload.slice(0, 25);

    for (const file of imagesToProcess) {
      try {
        uploadedLocalFilePaths.push(file.path);

        const { public_id } = await uploadPhoto(file.path, "vehicle_photos");
        imagePublicIds.push(public_id);

        try {
          await fs.access(file.path);
          await fs.unlink(file.path);
          const index = uploadedLocalFilePaths.indexOf(file.path);
          if (index > -1) {
            uploadedLocalFilePaths.splice(index, 1);
          }
        } catch (accessOrUnlinkError) {
          console.warn(
            `Could not delete local temp file ${file.path}:`,
            accessOrUnlinkError.message
          );
        }
      } catch (uploadError) {
        console.error(
          `Failed to upload image "${
            file.originalFilename || file.name
          }" to Cloudinary:`,
          uploadError.message
        );
      }
    }
    // --- END Cloudinary Image Uploads ---

    // Insert vehicle
    const [insertResult] = await pool.query(
      `INSERT INTO tbl_vehicles (
        userId, vin, year, make, model, series, bodyStyle, engine,
        transmission, driveType, fuelType, color, mileage,
        vehicleCondition, keysAvailable, locationId,
        saleStatus, auctionDate, currentBid, buyNowPrice,
        image, certifyStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        vin,
        parseInt(year) || null,
        make,
        model,
        series,
        bodyStyle,
        engine,
        transmission,
        driveType,
        fuelType,
        color,
        parseInt(mileage) || null,
        vehicleCondition,
        keysAvailable === "true" || keysAvailable === true,
        locationId,
        "live",
        auctionDate || null,
        parseFloat(currentBid) || 0.0,
        parseFloat(buyNowPrice) || null,
        JSON.stringify(imagePublicIds), // Store Cloudinary public_ids as JSON string
        certifyStatus,
      ]
    );

    console.log("this is fucking salestatus", saleStatus);

    // Return inserted vehicle
    const [newVehicle] = await pool.query(
      "SELECT * FROM tbl_vehicles WHERE id = ?",
      [insertResult.insertId]
    );

    // const realPrice = formatingPrice(buyNowPrice);
    // const priceObj = { buyNowPrice: realPrice };
    // console.log("Formatted Buy Now Price:", priceObj);

    // IMPORTANT: For the response, we should also provide the Cloudinary URLs
    const newVehicleWithImages = { ...newVehicle[0] };
    newVehicleWithImages.images = imagePublicIds.map(
      (publicId) =>
        getPhotoUrl(publicId, { width: 400, crop: "limit", quality: "auto" }) // Corrected call here!
    );
    delete newVehicleWithImages.image; // Remove the internal public_ids field from the response

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      ...newVehicleWithImages,
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);

    // Clean up any temporary files that were uploaded locally but failed to transfer to Cloudinary
    if (uploadedLocalFilePaths.length > 0) {
      console.log(
        "Cleaning up local temporary files due to error:",
        uploadedLocalFilePaths
      );
      await Promise.all(
        uploadedLocalFilePaths.map(async (path) => {
          try {
            await fs.access(path); // Check if file exists before trying to delete
            await fs.unlink(path);
          } catch (cleanupError) {
            // This catch block handles cases where the file might have been deleted by another process
            // or never existed (e.g., if the initial file.path was bad)
            console.error(
              `Failed to clean up local file ${path}:`,
              cleanupError.message
            );
          }
        })
      );
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getVehicles = async (req, res) => {
  try {
    const {
      year,
      auctionDate,
      auctionDateStart,
      auctionDateEnd,
      vehicleCondition,
      locationId,  
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      buyNowPrice,
      maxPrice,
      minPrice,
      color,
      search,
      sortType,
    } = req.query;
 
    const defaultLimit = 100000000000;
    const defaultPage = 1;
    const entry = parseInt(req.query.entry) || defaultLimit;
    const page = parseInt(req.query.page) || defaultPage;
    const limit = Math.max(1, entry);
    const offset = (Math.max(1, page) - 1) * limit;
 
    // ✅ Include tbl_cities join
    let query = `
      SELECT v.*, c.cityName
      FROM tbl_vehicles v
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE v.vehicleStatus = 'Y'
    `;
 
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_vehicles v
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE v.vehicleStatus = 'Y'
    `;
 
    const params = [];
    const countParams = [];
 
    // Auction Date filters
    if (auctionDateStart && auctionDateEnd) {
      query += ` AND v.auctionDate BETWEEN ? AND ?`;
      countQuery += ` AND v.auctionDate BETWEEN ? AND ?`;
      params.push(auctionDateStart, auctionDateEnd);
      countParams.push(auctionDateStart, auctionDateEnd);
    } else if (auctionDate) {
      query += ` AND v.auctionDate = ?`;
      countQuery += ` AND v.auctionDate = ?`;
      params.push(auctionDate);
      countParams.push(auctionDate);
    }
 
    // Filter by locationId (numeric only, now matched directly with JOIN)
    if (locationId) {
      query += ` AND v.locationId = ?`;
      countQuery += ` AND v.locationId = ?`;
      params.push(locationId);
      countParams.push(locationId);
    }
 
    if (maxPrice && minPrice) {
      query += ` AND v.buyNowPrice BETWEEN ? AND ?`;
      countQuery += ` AND v.buyNowPrice BETWEEN ? AND ?`;
      params.push(minPrice, maxPrice);
      countParams.push(minPrice, maxPrice);
    } else if (buyNowPrice) {
      query += ` AND v.buyNowPrice <= ?`;
      countQuery += ` AND v.buyNowPrice <= ?`;
      params.push(buyNowPrice);
      countParams.push(buyNowPrice);
    }
 
    if (year) {
      query += ` AND v.year = ?`;
      countQuery += ` AND v.year = ?`;
      params.push(year);
      countParams.push(year);
    }
 
    if (search) {
      query += ` AND (
        v.make LIKE ? OR
        v.model LIKE ? OR
        v.series LIKE ? OR
        v.bodyStyle LIKE ? OR
        v.color LIKE ?
      )`;
      countQuery += ` AND (
        v.make LIKE ? OR
        v.model LIKE ? OR
        v.series LIKE ? OR
        v.bodyStyle LIKE ? OR
        v.color LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      for (let i = 0; i < 5; i++) {
        params.push(searchTerm);
        countParams.push(searchTerm);
      }
    }
 
    let makeName = make;
    let modelName = model;
 
    if (make && !isNaN(make)) {
      const [rows] = await pool.query(
        `SELECT brandName FROM tbl_brands WHERE id = ?`,
        [make]
      );
      if (rows.length > 0) {
        makeName = rows[0].brandName;
      }
    }
 
    if (model && !isNaN(model)) {
      const [rows] = await pool.query(
        `SELECT modelName FROM tbl_model WHERE id = ?`,
        [model]
      );
      if (rows.length > 0) {
        modelName = rows[0].modelName;
      }
    }
 
    const filters = {
      make: makeName,
      model: modelName,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
    };
 
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query += ` AND v.${key} = ?`;
        countQuery += ` AND v.${key} = ?`;
        params.push(value);
        countParams.push(value);
      }
    });
 
    if (vehicleCondition && vehicleCondition !== "all") {
      query += ` AND v.vehicleCondition = ?`;
      countQuery += ` AND v.vehicleCondition = ?`;
      params.push(vehicleCondition);
      countParams.push(vehicleCondition);
    }
 
    // Sorting
    if (sortType) {
      if (sortType === "low") {
        query += ` ORDER BY v.buyNowPrice ASC`;
      } else if (sortType === "high") {
        query += ` ORDER BY v.buyNowPrice DESC`;
      } else if (sortType === "new") {
        query += ` ORDER BY v.auctionDate DESC`;
      } else {
        query += ` ORDER BY v.auctionDate DESC`;
      }
    } else {
      query += ` ORDER BY v.id ASC`;
    }
 
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
 
    const [vehicles] = await pool.query(query, params);
    const [totalVehicles] = await pool.query(countQuery, countParams);
    const total = totalVehicles[0].total;
 
    const vehiclesWithImages = await Promise.all(
      vehicles.map(async (vehicle) => {
        const processedVehicle = { ...vehicle };
 
        try {
          processedVehicle.buyNowPrice = formatingPrice(vehicle.buyNowPrice);
        } catch {
          processedVehicle.buyNowPrice = null;
        }
        try {
          processedVehicle.currentBid = formatingPrice(vehicle.currentBid);
        } catch {
          processedVehicle.currentBid = null;
        }
 
        let imageUrls = [];
        if (processedVehicle.image) {
          try {
            const publicIds = JSON.parse(processedVehicle.image);
            if (Array.isArray(publicIds)) {
              imageUrls = publicIds
                .map((publicId) =>
                  getPhotoUrl(publicId, {
                    width: 800,
                    crop: "limit",
                    quality: "auto",
                    fetch_format: "auto",
                  })
                )
                .filter(Boolean);
            }
          } catch {
            imageUrls = [];
          }
        }
 
        processedVehicle.images = imageUrls;
        delete processedVehicle.image;
 
        return processedVehicle;
      })
    );
 
    res.status(200).json(vehiclesWithImages);
 
  } catch (error) {
    console.error("Failed to fetch Vehicles:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

export const updateVehicle = async (req, res) => {
  const uploadedLocalFilePaths = [];
  try {
    const vehicleId = req.params.id;

    const {
      userId,
      // vin disabled
      year,
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
      mileage,
      vehicleCondition,
      keysAvailable,
      auctionDate,
      locationId,
      saleStatus = "upcoming",
      currentBid = 0.0,
      buyNowPrice,
      certifyStatus,
    } = req.body;

    let vcondition = vehicleCondition ? vehicleCondition : "";
    const normalizedAuctionDate = auctionDate || null;

    // Check if vehicle exists
    const [vehicleRows] = await pool.query(
      "SELECT * FROM tbl_vehicles WHERE id = ?",
      [vehicleId]
    );
    if (!vehicleRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }
    const vehicle = vehicleRows[0];

    // --- Process New Images (Cloudinary) ---
    const imagePublicIds = [];
    // FIXED: Use the same file handling approach as addVehicle
    const filesToUpload =
      req.files && req.files.image
        ? Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image]
        : [];
    const imagesToProcess = filesToUpload.slice(0, 25);

    for (const file of imagesToProcess) {
      try {
        uploadedLocalFilePaths.push(file.path);

        const { public_id } = await uploadPhoto(file.path, "vehicle_photos");
        imagePublicIds.push(public_id);

        try {
          await fs.access(file.path);
          await fs.unlink(file.path);
          const index = uploadedLocalFilePaths.indexOf(file.path);
          if (index > -1) {
            uploadedLocalFilePaths.splice(index, 1);
          }
        } catch (err) {
          console.warn(`Could not delete temp file ${file.path}:`, err.message);
        }
      } catch (uploadError) {
        console.error(
          `Failed to upload image "${
            file.originalFilename || file.name
          }" to Cloudinary:`,
          uploadError.message
        );
      }
    }

    // If no new images uploaded, keep old ones
    let finalImagePublicIds =
      imagePublicIds.length > 0
        ? imagePublicIds
        : JSON.parse(vehicle.image || "[]");

    // --- Update Fields ---
    const updateFields = {
      userId,
      year: parseInt(year) || null,
      make,
      model,
      series: series || null,
      bodyStyle: bodyStyle || null,
      engine: engine || null,
      transmission: transmission || null,
      driveType: driveType || null,
      fuelType: fuelType || null,
      color: color || null,
      mileage: parseInt(mileage) || null,
      vehicleCondition: vcondition,
      keysAvailable: keysAvailable === "true" || keysAvailable === true,
      locationId,
      saleStatus,
      auctionDate: normalizedAuctionDate,
      currentBid: parseFloat(currentBid) || 0.0,
      buyNowPrice: parseFloat(buyNowPrice) || null,
      certifyStatus: certifyStatus || null,
      image: JSON.stringify(finalImagePublicIds),
    };

    // Update DB
    await pool.query("UPDATE tbl_vehicles SET ? WHERE id = ?", [
      updateFields,
      vehicleId,
    ]);

    const [updatedRows] = await pool.query(
      "SELECT * FROM tbl_vehicles WHERE id = ?",
      [vehicleId]
    );

    // Format Buy Now Price
    const realPrice = formatingPrice(buyNowPrice);
    const priceObj = { buyNowPrice: realPrice };

    // Build response with Cloudinary URLs
    const updatedVehicleWithImages = { ...updatedRows[0] };
    updatedVehicleWithImages.images = finalImagePublicIds.map((publicId) =>
      getPhotoUrl(publicId, { width: 400, crop: "limit", quality: "auto" })
    );
    delete updatedVehicleWithImages.image;

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      ...updatedVehicleWithImages,
      ...priceObj,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);

    // Clean up local temp files if error
    if (uploadedLocalFilePaths.length > 0) {
      await Promise.all(
        uploadedLocalFilePaths.map(async (path) => {
          try {
            await fs.access(path);
            await fs.unlink(path);
          } catch (cleanupError) {
            console.error(`Failed to clean up ${path}:`, cleanupError.message);
          }
        })
      );
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;

    // Check if vehicle exists
    const [vehicle] = await pool.query(
      "SELECT * FROM tbl_vehicles WHERE id = ?",
      [vehicleId]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Delete the vehicle
    await pool.query(
      `update tbl_vehicles set vehicleStatus = 'N' WHERE id = ?`,
      [vehicleId]
    );

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error(" Error deleting Vehicle:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const getVehicleByMake = async (req, res) => {
  try {
    const { requestedMake, queryparams } = req.query;

    const {
      year,
      auctionDate,
      auctionDateStart,
      auctionDateEnd,
      mileage,
      mileageMin,
      mileageMax,
      yearMin,
      yearMax,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
      search,
    } = req.query;

    const defaultLimit = 10;
    const defaultPage = 1;

    const entry = parseInt(req.query.entry) || defaultLimit;
    const page = parseInt(req.query.page) || defaultPage;

    const limit = Math.max(1, entry);
    const offset = (Math.max(1, page) - 1) * limit;

    let query = `SELECT * FROM tbl_vehicles WHERE vehicleStatus = 'Y'`;
    let countQuery = `SELECT COUNT(*) as total FROM tbl_vehicles WHERE vehicleStatus = 'Y'`;

    const params = [];
    const countParams = [];

    // Prioritize requestedMake > queryparams
    const makeToUse = requestedMake || queryparams;
    if (makeToUse) {
      query += ` AND make = ?`;
      countQuery += ` AND make = ?`;
      params.push(makeToUse);
      countParams.push(makeToUse);
    }

    if (auctionDateStart && auctionDateEnd) {
      query += ` AND auctionDate BETWEEN ? AND ?`;
      countQuery += ` AND auctionDate BETWEEN ? AND ?`;
      params.push(auctionDateStart, auctionDateEnd);
      countParams.push(auctionDateStart, auctionDateEnd);
    } else if (auctionDate) {
      query += ` AND auctionDate = ?`;
      countQuery += ` AND auctionDate = ?`;
      params.push(auctionDate);
      countParams.push(auctionDate);
    }

    query += ` ORDER BY auctionDate DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [vehicles] = await pool.query(query, params);
    const [totalVehicles] = await pool.query(countQuery, countParams);
    const total = totalVehicles[0].total;

    // --- Process Images and Prices ---
    const vehiclesWithImages = await Promise.all(
      vehicles.map(async (vehicle) => {
        const processedVehicle = { ...vehicle };

        // Price Formatting
        try {
          processedVehicle.buyNowPrice = formatingPrice(vehicle.buyNowPrice);
        } catch {
          processedVehicle.buyNowPrice = null;
        }

        try {
          processedVehicle.currentBid = formatingPrice(vehicle.currentBid);
        } catch {
          processedVehicle.currentBid = null;
        }

        // Cloudinary Image URLs
        let imageUrls = [];
        try {
          const publicIds = JSON.parse(vehicle.image);
          if (Array.isArray(publicIds)) {
            imageUrls = publicIds.map((publicId) =>
              getPhotoUrl(publicId, {
                width: 800,
                crop: "limit",
                quality: "auto",
                fetch_format: "auto",
              })
            );
          }
        } catch (err) {
          console.warn(
            `Failed to parse Cloudinary image array for vehicle ${vehicle.id}:`,
            err.message
          );
        }

        processedVehicle.images = imageUrls;
        delete processedVehicle.image;

        return processedVehicle;
      })
    );

    res.status(200).json(vehiclesWithImages);
  } catch (error) {
    console.error("Failed to fetch Vehicles:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getVehiclesById = async (req, res) => {
  try {
    const id = req.params.id;

    const {
      year,
      auctionDate,
      auctionDateStart,
      auctionDateEnd,
      yearMin,
      yearMax,
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
      search,
    } = req.query;

    const defaultLimit = 10;
    const defaultPage = 1;

    const entry = parseInt(req.query.entry) || defaultLimit;
    const page = parseInt(req.query.page) || defaultPage;

    const limit = Math.max(1, entry);
    const offset = (Math.max(1, page) - 1) * limit;

    let query = `select id as newVehicleId,
    userId,
    vin,
    year,
    make,
    model,
    series,
    bodyStyle,
    engine,
    transmission,
    driveType,
    fuelType,
    color,
    mileage,
    vehicleCondition,
    keysAvailable,
    locationId,
    saleStatus,
    auctionDate,
    currentBid,
    buyNowPrice,
    vehicleStatus,
    image,
    certifyStatus from tbl_vehicles WHERE 1=1 AND vehicleStatus = 'Y'`;
    //  let query =     `select * from tbl_vehicles WHERE 1=1 AND vehicleStatus = 'Y'`;
    let countQuery = `SELECT COUNT(*) as total FROM tbl_vehicles WHERE 1=1 AND vehicleStatus = 'Y'`;
    const params = [];
    const countParams = [];

    if (auctionDateStart && auctionDateEnd) {
      query += ` AND auctionDate BETWEEN ? AND ?`;
      countQuery += ` AND auctionDate BETWEEN ? AND ?`;
      params.push(auctionDateStart, auctionDateEnd);
      countParams.push(auctionDateStart, auctionDateEnd);
    } else if (auctionDate) {
      query += ` AND auctionDate = ?`;
      countQuery += ` AND auctionDate = ?`;
      params.push(auctionDate);
      countParams.push(auctionDate);
    }

    if (yearMin && yearMax) {
      query += ` AND year BETWEEN ? AND ?`;
      countQuery += ` AND year BETWEEN ? AND ?`;
      params.push(yearMin, yearMax);
      countParams.push(yearMin, yearMax);
    } else if (year) {
      query += ` AND year = ?`;
      countQuery += ` AND year = ?`;
      params.push(year);
      countParams.push(year);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (make LIKE ? OR model LIKE ? OR series LIKE ? OR bodyStyle LIKE ? OR color LIKE ?)`;
      countQuery += ` AND (make LIKE ? OR model LIKE ? OR series LIKE ? OR bodyStyle LIKE ? OR color LIKE ?)`;
      const terms = Array(5).fill(searchTerm);
      params.push(...terms);
      countParams.push(...terms);
    }

    const filters = {
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        query += ` AND ${key} = ?`;
        countQuery += ` AND ${key} = ?`;
        params.push(value);
        countParams.push(value);
      }
    }

    query += ` AND id = ? ORDER BY auctionDate DESC LIMIT ? OFFSET ?`;
    params.push(id, limit, offset);

    const [vehicles] = await pool.query(query, params);

    const [totalVehicles] = await pool.query(countQuery, countParams);
    const total = totalVehicles[0].total;

    // For each vehicle, fetch its image and specs
    const enrichedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        let base64Image = null;
        if (vehicle.image) {
          const imagePath = path.join(process.cwd(), vehicle.image);
          if (fsSync.existsSync(imagePath)) {
            const buffer = await fs.readFile(imagePath);
            const ext = path.extname(imagePath).slice(1).toLowerCase();
            base64Image = `data:image/${ext};base64,${buffer.toString(
              "base64"
            )}`;
          }
        }

        const [specs] = await pool.query(
          `SELECT * FROM tbl_vehicle_specifications WHERE vehicleId = ?`,
          [vehicle.newVehicleId] // or `vehicle.id` depending on your aliasing
        );

        return {
          ...vehicle,
          image: base64Image,
          ...specs[0],
        };
      })
    );

    res.status(200).json(enrichedVehicles[0]); //  no need to spread destructure
  } catch (error) {
    console.error("Failed to fetch vehicle by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getVehiclesByUser = async (req, res) => {
  try {
    const id = req.params.id;
 
    const {
      year,
      auctionDate,
      auctionDateStart,
      auctionDateEnd,
      yearMin,
      yearMax,
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
      search,
    } = req.query;
 
    const defaultLimit = 100000000;
    const defaultPage = 1;
    const entry = parseInt(req.query.entry) || defaultLimit;
    const page = parseInt(req.query.page) || defaultPage;
    const limit = Math.max(1, entry);
    const offset = (Math.max(1, page) - 1) * limit;
 
    let query = `
      SELECT v.id AS newVehicleId,
        v.userId, v.vin, v.year, v.make, v.model, v.series, v.bodyStyle,
        v.engine, v.transmission, v.driveType, v.fuelType, v.color, v.mileage,
        v.vehicleCondition, v.keysAvailable, v.locationId, c.cityName,
        v.saleStatus, v.auctionDate, v.currentBid, v.buyNowPrice,
        v.vehicleStatus, v.image, v.certifyStatus
      FROM tbl_vehicles v
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE 1=1 AND v.vehicleStatus = 'Y'
    `;
 
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_vehicles v
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE 1=1 AND v.vehicleStatus = 'Y'
    `;
 
    const params = [];
    const countParams = [];
 
    // Date filters
    if (auctionDateStart && auctionDateEnd) {
      query += ` AND v.auctionDate BETWEEN ? AND ?`;
      countQuery += ` AND v.auctionDate BETWEEN ? AND ?`;
      params.push(auctionDateStart, auctionDateEnd);
      countParams.push(auctionDateStart, auctionDateEnd);
    } else if (auctionDate) {
      query += ` AND v.auctionDate = ?`;
      countQuery += ` AND v.auctionDate = ?`;
      params.push(auctionDate);
      countParams.push(auctionDate);
    }
 
    // Year filters
    if (yearMin && yearMax) {
      query += ` AND v.year BETWEEN ? AND ?`;
      countQuery += ` AND v.year BETWEEN ? AND ?`;
      params.push(yearMin, yearMax);
      countParams.push(yearMin, yearMax);
    } else if (year) {
      query += ` AND v.year = ?`;
      countQuery += ` AND v.year = ?`;
      params.push(year);
      countParams.push(year);
    }
 
    // Search filter
    if (search) {
      const term = `%${search}%`;
      const fields = ["v.make", "v.model", "v.series", "v.bodyStyle", "v.color"];
      const searchClause = fields.map((f) => `${f} LIKE ?`).join(" OR ");
      query += ` AND (${searchClause})`;
      countQuery += ` AND (${searchClause})`;
      const repeated = Array(fields.length).fill(term);
      params.push(...repeated);
      countParams.push(...repeated);
    }
 
    // Dynamic filters
    const filters = {
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
    };
 
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        query += ` AND v.${key} = ?`;
        countQuery += ` AND v.${key} = ?`;
        params.push(value);
        countParams.push(value);
      }
    }
 
    // Final user + pagination clauses
    query += ` AND v.userId = ? ORDER BY v.auctionDate DESC LIMIT ? OFFSET ?`;
    params.push(id, limit, offset);
 
    const [vehicles] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
 
    const enrichedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Convert Cloudinary public_ids to URLs
        let cloudinaryImages = [];
        try {
          if (vehicle.image) {
            const parsed = JSON.parse(vehicle.image);
            if (Array.isArray(parsed)) {
              cloudinaryImages = parsed.map((publicId) =>
                getPhotoUrl(publicId, {
                  width: 400,
                  crop: "thumb",
                  quality: "auto",
                })
              );
            }
          }
        } catch (err) {
          console.warn(
            `Failed to parse image JSON for vehicle ${vehicle.newVehicleId}:`,
            err.message
          );
        }
 
        // Fetch specifications
        const [specs] = await pool.query(
          `SELECT * FROM tbl_vehicle_specifications WHERE vehicleId = ?`,
          [vehicle.newVehicleId]
        );
 
        return {
          ...vehicle,
          buyNowPrice: formatingPrice(vehicle.buyNowPrice),
          images: cloudinaryImages,
          ...specs[0],
        };
      })
    );
 
    res.status(200).json(enrichedVehicles);
  } catch (error) {
    console.error("Failed to fetch vehicles by user ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const todayAuction = async (req, res) => {
  try {
    const { search, auctionDate } = req.query;

    let whereClauses = [
      `DATE(b.startTime) = CURDATE()`,
      `v.vehicleStatus = 'Y'`,
      `(u.role = 'seller' OR u.role = 'admin')`,
      `(b.auctionStatus = 'upcoming' OR b.auctionStatus = 'live')`,
    ];

    let values = [];

    //  Only add search if it's non-empty
    if (search && search.trim() !== "") {
      const likeValue = `%${search.trim()}%`;

      whereClauses.push(`
        (
          v.make LIKE ? OR
          v.locationId LIKE ? OR
          v.model LIKE ? OR
          v.series LIKE ? OR
          v.bodyStyle LIKE ? OR
          v.color LIKE ? OR
          v.vin LIKE ? OR
          b.id LIKE ?
        )
      `);

      values.push(
        likeValue, // make
        likeValue, // locationId
        likeValue, // model
        likeValue, // series
        likeValue, // bodyStyle
        likeValue, // color
        likeValue, // vin
        likeValue // b.id
      );
    }

    //  Add auction date filter if provided
    if (auctionDate && auctionDate.trim() !== "") {
      whereClauses.push(`DATE(v.auctionDate) = ?`);
      values.push(auctionDate.trim());
    }

    const [result] = await pool.query(
      `
        SELECT
          b.id AS bidId,
          b.userId,
          b.vehicleId,
          b.estRetailValue,
          b.yourOffer,
          b.sellerOffer,
          b.bidStatus,
          b.eligibilityStatus,
          b.saleStatus,
          b.maxBid,
          b.MonsterBid,
          b.bidApprStatus,
          b.status AS bidStatusFlag,
          b.winStatus,
          b.createdAt AS bidCreatedAt,
          b.updatedAt AS bidUpdatedAt,
          b.startTime,
          b.endTime,
          b.auctionStatus,
 
          v.id AS vehicleId,
          v.vin,
          v.year,
          v.make,
          v.model,
          v.series,
          v.bodyStyle,
          v.engine,
          v.transmission,
          v.driveType,
          v.fuelType,
          v.color,
          v.mileage,
          v.vehicleCondition,
          v.keysAvailable,
          v.locationId,
          v.auctionDate,
          v.currentBid,
          v.buyNowPrice,
          v.vehicleStatus,
          v.image,
          v.certifyStatus,
 
          u.id AS userId,
          u.name,
          u.contact,
          u.cnic,
          u.address,
          u.postcode,
          u.email,
          u.date,
          u.role
 
        FROM tbl_vehicles v
        JOIN tbl_bid b ON v.id = b.vehicleId
        JOIN tbl_users u ON u.id = b.userId
        WHERE ${whereClauses.join(" AND ")}
      `,
      values
    );

    const formattedResult = result.map((row) => {
      const formatPriceField = (field) => {
        try {
          return formatingPrice(row[field]);
        } catch {
          return null;
        }
      };

      let cloudinaryImages = [];
      try {
        if (row.image) {
          const parsed = JSON.parse(row.image);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cloudinaryImages = parsed.map((publicId) =>
              getPhotoUrl(publicId, {
                width: 400,
                crop: "thumb",
                quality: "auto",
              })
            );
          }
        }
      } catch (err) {
        console.warn(
          `Failed to parse image array for bidId ${row.bidId}:`,
          err.message
        );
      }

      return {
        ...row,
        yourOffer: formatPriceField("yourOffer"),
        sellerOffer: formatPriceField("sellerOffer"),
        buyNowPrice: formatPriceField("buyNowPrice"),
        currentBid: formatPriceField("currentBid"),
        maxBid: formatPriceField("maxBid"),
        MonsterBid: formatPriceField("MonsterBid"),
        images: cloudinaryImages,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error in live Auctions controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getMake = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select distinct(make) from tbl_vehicles where vehicleStatus = 'Y'`
    );

    if (!query || query.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No models found",
      });
    }
    return res.status(200).json(query);
  } catch (error) {
    console.error("Failed to fetch model:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getModel = async (req, res) => {
  try {
    const make = req.query.make || null;

    if (!make) {
      return res.status(400).json({
        success: false,
        message: "Make is required in query params",
      });
    }

    const [models] = await pool.query(
      `SELECT DISTINCT(model) FROM tbl_vehicles WHERE make = ? AND vehicleStatus = 'Y'`,
      [make]
    );

    return res.status(200).json(models);
  } catch (error) {
    console.error("Failed to fetch model:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getYear = async (req, res) => {
  try {
    const model = req.query.model || null;

    if (!model) {
      return res.status(400).json({
        success: false,
        message: "Model is required in query params",
      });
    }

    const [models] = await pool.query(
      `SELECT DISTINCT(year) FROM tbl_vehicles WHERE model = ? AND vehicleStatus = 'Y'`,
      [model]
    );

    if (!models || models.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Year found for the provided make",
      });
    }

    return res.status(200).json(models);
  } catch (error) {
    console.error("Failed to fetch model:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const sortFilter = async (req, res) => {
  try {
    const sortType = req.query.sortType;

    if (sortType) {
      if (sortType === "low") {
        const lowtohigh = await pool.query(
          `select * from tbl_vehicles where vehicleStatus = 'Y' order by buyNowPrice asc`
        );
        const result = lowtohigh[0];
        return res.status(200).json(result);
      } else if (sortType === "high") {
        const hightolow = await pool.query(
          `select * from tbl_vehicles where vehicleStatus = 'Y' order by buyNowPrice desc`
        );
        const result = hightolow[0];
        return res.status(200).json(result);
      } else if (sortType === "new") {
        const newFirst = await pool.query(
          `select * from tbl_vehicles where vehicleStatus = 'Y' order by auctionDate desc`
        );
        const result = newFirst[0];
        return res.status(200).json(result);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Sort type is required in query params",
      });
    }

    return res.status(200).json({
      success: true,
      message: `please provide the right query`,
    });
  } catch (error) {
    console.error("Failed to add imported car:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const addImportedCar = async (req, res) => {
  try {
    const { make, model, year, name, city, mobileNumber } = req.body;

    const requiredFeilds = [
      "make",
      "model",
      "year",
      "name",
      "city",
      "mobileNumber",
    ];

    const missingField = requiredFeilds.filter((field) => !req.body[field]);

    if (missingField.length > 0) {
      return res.status(400).send({
        message: `Missing ${missingField}`,
      });
    }

    const insertQuery = `
      INSERT INTO tbl_imported_cars (make, model, year, name, city, mobileNumber)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [make, model, year, name, city, mobileNumber];

    const [result] = await pool.query(insertQuery, params);

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to add imported car",
      });
    }

    const id = result.insertId;

    const [getInserted] = await pool.query(
      `SELECT * FROM tbl_imported_cars WHERE id = ?`,
      [id]
    );

    return res.status(200).json({ ...getInserted[0] });
  } catch (error) {
    console.error("Failed to add imported car:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getImportedCar = async (req, res) => {
  try {
    const [query] = await pool.query(
      `SELECT * FROM tbl_imported_cars where status = 'Y'`
    );

    if (!query || query.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No imported cars found",
      });
    }
    return res.status(200).json(query);
  } catch (error) {
    console.error("Failed to fetch imported cars:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateImportedCar = async (req, res) => {
  try {
    const id = req.params.id;
    const { make, model, year, name, city, mobileNumber } = req.body;

    if (!make || !model || !year || !name || !city || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const updateQuery = `
      UPDATE tbl_imported_cars
      SET make = ?, model = ?, year = ?, name = ?, city = ?, mobileNumber = ?
      WHERE id = ?
    `;

    const params = [make, model, year, name, city, mobileNumber, id];
    const [result] = await pool.query(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Imported car not found or no changes made",
      });
    }

    const [data] = await pool.query(
      `SELECT * FROM tbl_imported_cars WHERE id = ?`,
      [id]
    );

    return res.status(200).json({ ...data[0] });
  } catch (error) {
    console.error("Failed to update imported car:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteImportedCar = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.query(
      `UPDATE tbl_imported_cars SET status = 'N' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Imported car not found",
      });
    }

    const [deletedCar] = await pool.query(
      `SELECT * FROM tbl_imported_cars WHERE id = ?`,
      [id]
    );

    return res
      .status(200)
      .json({ ...deletedCar[0], message: "Imported car deleted successfully" });
  } catch (error) {
    console.error("Failed to delete imported car:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getVehicleFinder = async (req, res) => {
  try {
    const {
      year,
      auctionDate,
      auctionDateStart,
      auctionDateEnd,
      vehicleCondition,
      locationId,
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      buyNowPrice,
      maxPrice,
      minPrice,
      color,
      search,
    } = req.body;

    const defaultLimit = 100000000000;
    const defaultPage = 1;
    const entry = parseInt(req.query.entry) || defaultLimit;
    const page = parseInt(req.query.page) || defaultPage;
    const limit = Math.max(1, entry);
    const offset = (Math.max(1, page) - 1) * limit;

    let query = `SELECT * FROM tbl_vehicles WHERE 1=1 AND vehicleStatus = 'Y'`;
    let countQuery = `SELECT COUNT(*) as total FROM tbl_vehicles WHERE 1=1 AND vehicleStatus = 'Y'`;
    const params = [];
    const countParams = [];

    // --- Dynamic Query Building (No Change) ---
    if (auctionDateStart && auctionDateEnd) {
      query += ` AND auctionDate BETWEEN ? AND ?`;
      countQuery += ` AND auctionDate BETWEEN ? AND ?`;
      params.push(auctionDateStart, auctionDateEnd);
      countParams.push(auctionDateStart, auctionDateEnd);
    } else if (auctionDate) {
      query += ` AND auctionDate = ?`;
      countQuery += ` AND auctionDate = ?`;
      params.push(auctionDate);
      countParams.push(auctionDate);
    }

    if (locationId) {
      query += ` AND locationId = ?`;
      countQuery += ` AND locationId = ?`;
      params.push(locationId);
      countParams.push(locationId);
    }

    if (maxPrice && minPrice) {
      query += ` AND buyNowPrice BETWEEN ? AND ?`;
      countQuery += ` AND buyNowPrice BETWEEN ? AND ?`;
      params.push(minPrice, maxPrice);
      countParams.push(minPrice, maxPrice);
    } else if (buyNowPrice) {
      query += ` AND buyNowPrice <= ?`;
      countQuery += ` AND buyNowPrice <= ?`;
      params.push(buyNowPrice);
      countParams.push(buyNowPrice);
    }

    if (year) {
      query += ` AND year = ?`;
      countQuery += ` AND year = ?`;
      params.push(year);
      countParams.push(year);
    }

    if (search) {
      query += ` AND (
        make LIKE ? OR
        model LIKE ? OR
        series LIKE ? OR
        bodyStyle LIKE ? OR
        color LIKE ?
      )`;
      countQuery += ` AND (
        make LIKE ? OR
        model LIKE ? OR
        series LIKE ? OR
        bodyStyle LIKE ? OR
        color LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      for (let i = 0; i < 5; i++) {
        params.push(searchTerm);
        countParams.push(searchTerm);
      }
    }

    const filters = {
      make,
      model,
      series,
      bodyStyle,
      engine,
      transmission,
      driveType,
      fuelType,
      color,
    };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query += ` AND ${key} = ?`;
        countQuery += ` AND ${key} = ?`;
        params.push(value);
        countParams.push(value);
      }
    });

    if (vehicleCondition && vehicleCondition !== "all") {
      query += ` AND vehicleCondition = ?`;
      countQuery += ` AND vehicleCondition = ?`;
      params.push(vehicleCondition);
      countParams.push(vehicleCondition);
    }

    query += ` ORDER BY auctionDate DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [vehicles] = await pool.query(query, params);

    const [totalVehicles] = await pool.query(countQuery, countParams);
    const total = totalVehicles[0].total;

    // --- Image Processing and Price Formatting (MODIFIED) ---
    const vehiclesWithImages = await Promise.all(
      vehicles.map(async (vehicle) => {
        const processedVehicle = { ...vehicle };

        // Price formatting (No Change)
        try {
          processedVehicle.buyNowPrice = formatingPrice(vehicle.buyNowPrice);
        } catch (err) {
          console.warn(
            `Error formatting buyNowPrice for vehicle ${vehicle.id}:`,
            err.message
          );
          processedVehicle.buyNowPrice = null;
        }
        try {
          processedVehicle.currentBid = formatingPrice(vehicle.currentBid);
        } catch (err) {
          console.warn(
            `Error formatting currentBid for vehicle ${vehicle.id}:`,
            err.message
          );
          processedVehicle.currentBid = null;
        }

        // --- Cloudinary Image URL Generation (NEW LOGIC) ---
        let imageUrls = [];
        // Assuming 'vehicle.image' now stores a JSON string of Cloudinary public_ids
        if (processedVehicle.image) {
          try {
            const publicIds = JSON.parse(processedVehicle.image);
            if (Array.isArray(publicIds)) {
              imageUrls = publicIds
                .map((publicId) => {
                  // Generate a URL for each public_id
                  // You can add transformations here if needed, e.g., { width: 400, crop: 'limit' }
                  return getPhotoUrl(publicId, {
                    width: 800,
                    crop: "limit",
                    quality: "auto",
                    fetch_format: "auto",
                  });
                })
                .filter(Boolean); // Filter out any empty strings if getPhotoUrl returns them for invalid publicIds
            } else {
              console.warn(
                `Vehicle ID ${processedVehicle.id} 'image' field is not an array after JSON.parse. Value:`,
                processedVehicle.image
              );
            }
          } catch (e) {
            console.error(
              `Failed to parse image public_ids JSON for vehicle ID ${processedVehicle.id}:`,
              e.message
            );
            imageUrls = []; // On JSON parsing failure, ensure imageUrls is empty
          }
        }

        processedVehicle.images = imageUrls; // Rename to 'images' for clarity on the frontend
        delete processedVehicle.image; // Remove the original 'image' field which contained public_ids string

        return processedVehicle;
      })
    );

    // Logging for debugging (optional, can be removed in production)
    if (vehiclesWithImages.length > 0) {
      console.log(
        "First vehicle buyNowPrice:",
        vehiclesWithImages[0]?.buyNowPrice
      );
      console.log(
        "First vehicle currentBid:",
        vehiclesWithImages[0]?.currentBid
      );
      console.log("First vehicle image URLs:", vehiclesWithImages[0]?.images); // See the new URLs
    }

    // Final response
    res.status(200).json(vehiclesWithImages);
  } catch (error) {
    console.error("Failed to fetch Vehicles:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};
