import { imageToBase64 } from "../utils/fileUtils.js";
import express from "express";
import pool from "../config/db.js";
import path from "path";
import fsSync from "fs";
import { formatingPrice } from "../utils/priceUtils.js";
import * as fs from "fs";
import * as fsAsync from "fs/promises";
// import { io } from "../socket.js";

import {
  uploadPhoto,
  getPhotoUrl,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";
import moment from "moment-timezone";

export const myBids = async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await pool.query(`select * from tbl_bid where userId = ?`, [
      id,
    ]);
    const vehicleId = rows[0].vehicleId;
    console.log(vehicleId);

    const [result] = await pool.query(
      `SELECT 
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
      JOIN tbl_bid b 
      ON v.id = b.vehicleId
      JOIN tbl_users u 
      ON u.id = b.userId
      WHERE v.vehicleStatus = 'Y'
      AND b.vehicleId = ?
      AND b.winStatus = 'Won'
      `,
      [vehicleId]
    );

    // Format result
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
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
        images: cloudinaryImages,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error in myBids controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const bidsForAdmin = async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT 
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
      JOIN tbl_bid b 
      ON v.id = b.vehicleId
      JOIN tbl_users u 
      ON u.id = b.userId
      WHERE v.vehicleStatus = 'Y'
      AND b.winStatus = 'Won'
      `
    );

    // Format result
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
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
        images: cloudinaryImages,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error in myBids controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const lotsWon = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "v.id",
      sortOrder = "DESC",
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const offset = (pageNumber - 1) * limitNumber;

    let baseQuery = `
      SELECT 
        v.*, 
        b.id as bidId,
        b.estRetailValue,
        b.yourOffer as MyLastBid,
        b.maxBid,
        b.MonsterBid,
        b.sellerOffer,
        v.buyNowPrice,
        v.currentBid,
        b.winStatus,
        v.image as vehicleImage
      FROM tbl_vehicles v
      JOIN tbl_bid b ON v.id = b.vehicleId
      WHERE v.vehicleStatus = 'Y' AND b.winStatus = 'Won'
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_vehicles v
      JOIN tbl_bid b ON v.id = b.vehicleId
      WHERE v.vehicleStatus = 'Y' AND b.winStatus = 'Won'
    `;

    const queryParams = [];
    const countParams = [];

    if (search) {
      const searchCondition = `
        AND (
          v.make LIKE ? OR 
          v.model LIKE ? OR 
          v.vin LIKE ? OR 
          v.color LIKE ? OR
          b.estRetailValue LIKE ?
        )
      `;
      const searchTerm = `%${search}%`;

      baseQuery += searchCondition;
      countQuery += searchCondition;

      queryParams.push(...Array(5).fill(searchTerm));
      countParams.push(...Array(5).fill(searchTerm));
    }

    const validSortFields = [
      "v.id",
      "v.make",
      "v.model",
      "v.year",
      "b.maxBid",
      "b.estRetailValue",
    ];
    const safeSortField = validSortFields.includes(sortField)
      ? sortField
      : "v.id";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    baseQuery += ` ORDER BY ${safeSortField} ${safeSortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limitNumber, offset);

    const [result] = await pool.query(baseQuery, queryParams);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No lots found matching your criteria",
      });
    }

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
        if (row.vehicleImage) {
          const parsed = JSON.parse(row.vehicleImage);
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
          `Failed to parse image JSON for bidId ${row.bidId}:`,
          err.message
        );
      }

      return {
        ...row,
        buyNowPrice: formatPriceField("buyNowPrice"),
        currentBid: formatPriceField("currentBid"),
        yourOffer: formatPriceField("MyLastBid"),
        estRetailValue: formatPriceField("estRetailValue"),
        sellerOffer: formatPriceField("sellerOffer"),
        maxBid: formatPriceField("maxBid"),
        MonsterBid: formatPriceField("MonsterBid"),
        images: cloudinaryImages,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error in lotsWon controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const lotsLost = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "v.id",
      sortOrder = "DESC",
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const offset = (pageNumber - 1) * limitNumber;

    let baseQuery = `
       SELECT 
        v.*, 
        b.id as bidId,
        b.estRetailValue,
        b.yourOffer as MyLastBid,
        b.maxBid,
        b.MonsterBid,
        b.sellerOffer,
        v.buyNowPrice,
        v.currentBid,
        b.winStatus,
        v.image as vehicleImage
      FROM tbl_vehicles v
      JOIN tbl_bid b ON v.id = b.vehicleId
      WHERE v.vehicleStatus = 'Y' AND b.winStatus = 'Lost'
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_vehicles v
      LEFT JOIN tbl_bid b ON v.id = b.vehicleId
      WHERE v.vehicleStatus = 'Y' AND b.winStatus = 'Lost'
    `;

    const queryParams = [];
    const countParams = [];

    if (search) {
      const searchCondition = `
        AND (
          v.make LIKE ? OR 
          v.model LIKE ? OR 
          v.vin LIKE ? OR 
          v.color LIKE ? OR
          b.estRetailValue LIKE ?
        )
      `;
      const searchTerm = `%${search}%`;
      baseQuery += searchCondition;
      countQuery += searchCondition;

      queryParams.push(...Array(5).fill(searchTerm));
      countParams.push(...Array(5).fill(searchTerm));
    }

    const validSortFields = [
      "v.id",
      "v.make",
      "v.model",
      "v.year",
      "b.estRetailValue",
    ];
    const safeSortField = validSortFields.includes(sortField)
      ? sortField
      : "v.id";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    baseQuery += ` ORDER BY ${safeSortField} ${safeSortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limitNumber, offset);

    const [bids] = await pool.query(baseQuery, queryParams);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    if (!bids.length) {
      return res.status(404).json({
        success: false,
        message: "No lost lots found",
      });
    }

    // Format price + Cloudinary image URLs
    const formattedResult = bids.map((row) => {
      const formatPriceField = (field) => {
        try {
          return formatingPrice(row[field]);
        } catch {
          return null;
        }
      };

      let cloudinaryImages = [];
      try {
        if (row.vehicleImage) {
          const parsed = JSON.parse(row.vehicleImage);
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
          `Failed to parse Cloudinary image JSON for bidId ${row.bidId}:`,
          err.message
        );
      }

      return {
        ...row,
        buyNowPrice: formatPriceField("buyNowPrice"),
        currentBid: formatPriceField("currentBid"),
        yourOffer: formatPriceField("MyLastBid"),
        estRetailValue: formatPriceField("estRetailValue"),
        sellerOffer: formatPriceField("sellerOffer"),
        maxBid: formatPriceField("maxBid"),
        MonsterBid: formatPriceField("monsterBid"),
        images: cloudinaryImages,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error in lotsLost controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const myOffers = async (req, res) => {
  try {
    // Extract query parameters with defaults
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "v.id",
      sortOrder = "DESC",
    } = req.query;

    // Validate and parse pagination parameters
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const offset = (pageNumber - 1) * limitNumber;

    // Base query
    let baseQuery = `
            SELECT v.*, b.estRetailValue, b.yourOffer, b.sellerOffer
            FROM tbl_vehicles v
            LEFT JOIN tbl_bid b ON v.id = b.vehicleId
            WHERE v.vehicleStatus = 'Y'
        `;

    // Count query for pagination
    let countQuery = `
            SELECT COUNT(*) as total
            FROM tbl_vehicles v
            LEFT JOIN tbl_bid b ON v.id = b.vehicleId
            WHERE v.vehicleStatus = 'Y'
        `;

    const queryParams = [];
    const countParams = [];

    // Add search functionality if provided
    if (search) {
      const searchCondition = `
                AND (
                    v.make LIKE ? OR 
                    v.model LIKE ? OR 
                    v.vin LIKE ? OR 
                    v.color LIKE ? OR
                    b.estRetailValue LIKE ?
                )
            `;
      const searchTerm = `%${search}%`;

      baseQuery += searchCondition;
      countQuery += searchCondition;

      // Add search term for each field (5 times)
      queryParams.push(...Array(5).fill(searchTerm));
      countParams.push(...Array(5).fill(searchTerm));
    }

    // Add sorting
    const validSortFields = [
      "v.id",
      "v.make",
      "v.model",
      "v.year",
      "b.maxBid",
      "b.estRetailValue",
    ];
    const safeSortField = validSortFields.includes(sortField)
      ? sortField
      : "b.createdAt";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    baseQuery += ` ORDER BY ${safeSortField} ${safeSortOrder}`;

    // Add pagination
    baseQuery += ` LIMIT ? OFFSET ?`;
    queryParams.push(limitNumber, offset);

    // Execute queries
    const [bids] = await pool.query(baseQuery, queryParams);
    const [[totalCount]] = await pool.query(countQuery, countParams);
    const total = totalCount.total;

    if (bids.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bids found matching your criteria",
      });
    }

    res.status(200).json(bids);
  } catch (error) {
    console.error("Error in lotsWon controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const liveAuctions = async (req, res) => {
  try {
    const id = req.params.id;
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
    WHERE 
      b.auctionStatus = 'live' 
      AND v.vehicleStatus = 'Y' 
      AND (u.role = 'seller' OR u.role = 'admin')
      AND u.id = ?
      AND b.startTime >= CURDATE()
  `,
      [id]
    );

    const formattedResult = result.map((row) => {
      // Format prices safely
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
          const parsed = JSON.parse(row.image); // Expected: ["id1", "id2", ...]
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
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
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

export const liveAuctionsForAdmin = async (req, res) => {
  try {
    const [result] = await pool.query(`
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
        c.cityName as locationId,
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
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE 
        b.auctionStatus = 'live' 
        AND v.vehicleStatus = 'Y' 
        AND (u.role = 'seller' OR u.role = 'admin')
        AND b.startTime >= CURDATE()
        AND b.startTime >= CURDATE()
    `);

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
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
        images: cloudinaryImages,
        cityName: row.cityName || "Unknown",
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

export const liveAuctionsById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID parameter is required",
      });
    }

    const [result] = await pool.query(
      `SELECT b.*, v.*, u.*
      FROM tbl_vehicles v
      JOIN tbl_bid b ON v.id = b.vehicleId
      JOIN tbl_users u ON u.id = b.userId
      WHERE
        b.id = ?
        AND
        b.auctionStatus = 'live'
        AND v.vehicleStatus = 'Y'
        AND (u.role = 'seller' OR u.role = 'admin')`,
      [id]
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in live Auctions controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const upcomingAuctions = async (req, res) => {
  try {
    const id = req.params.id;
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

      FROM tbl_bid b
      JOIN tbl_vehicles v ON v.id = b.vehicleId
      JOIN tbl_users u ON u.id = b.userId
      WHERE
        b.auctionStatus = 'upcoming'
        AND v.vehicleStatus = 'Y'
        AND (u.role = 'seller' OR u.role = 'admin')
        and u.id = ?
        AND b.startTime >= CURDATE()

    `,
      [id]
    );

    const formattedResult = result.map((row) => {
      // Format prices safely
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
        // startTime: new Date(row.startTime).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        // endTime: new Date(row.endTime).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
        images: cloudinaryImages,
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Failed to fetch Vehicles:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

export const upcomingAuctionsForAdmin = async (req, res) => {
  try {
    const [result] = await pool.query(`
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
        c.cityName as locationId,
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

      FROM tbl_bid b
      JOIN tbl_vehicles v ON v.id = b.vehicleId
      JOIN tbl_users u ON u.id = b.userId
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE
        b.auctionStatus = 'upcoming'
        AND v.vehicleStatus = 'Y'
        AND (u.role = 'seller' OR u.role = 'admin')
    `);

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
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
        images: cloudinaryImages,
        cityName: row.cityName || "Unknown",
      };
    });

    return res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Failed to fetch Vehicles:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

export const auctionHistory = async (req, res) => {
  try {
    const [result] = await pool.query(`
SELECT b.*, v.*, u.*
FROM tbl_vehicles v
JOIN tbl_bid b ON v.id = b.vehicleId
JOIN tbl_users u ON u.id = b.userId
WHERE
  b.auctionStatus = 'end'
  AND v.vehicleStatus = 'Y'
  AND (u.role = 'seller' OR u.role = 'admin')`);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in live Auctions controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCertifiedVehicles = async (req, res) => {
  try {
    const [vehicles] = await pool.query(`
      SELECT 
        v.*, 
        c.cityName as locationId 
      FROM tbl_vehicles v
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE v.vehicleStatus = 'Y' 
        AND v.certifyStatus = 'Certified' 
        AND v.approval = 'Y'
    `);

    const vehiclesWithImages = vehicles.map((vehicle) => {
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
          `Error parsing images for vehicle ${vehicle.id}:`,
          err.message
        );
      }

      return {
        ...vehicle,
        buyNowPrice: formatingPrice(vehicle.buyNowPrice),
        images: cloudinaryImages,
        cityName: vehicle.cityName || "Unknown",
      };
    });

    res.status(200).json(vehiclesWithImages);
  } catch (error) {
    console.error("Error fetching certified vehicles!:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getNonCertifiedVehicles = async (req, res) => {
  try {
    const [vehicles] = await pool.query(`
      SELECT 
        v.*, 
        c.cityName as locationId
      FROM tbl_vehicles v
      LEFT JOIN tbl_cities c ON v.locationId = c.id
      WHERE v.vehicleStatus = 'Y' 
        AND v.certifyStatus = 'Non-Certified' 
        AND v.approval = 'Y'
    `);

    const vehiclesWithImages = vehicles.map((vehicle) => {
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
          `Error parsing image data for vehicle ${vehicle.id}:`,
          err.message
        );
      }

      return {
        ...vehicle,
        buyNowPrice: formatingPrice(vehicle.buyNowPrice),
        images: cloudinaryImages,
        cityName: vehicle.cityName || "Unknown",
      };
    });

    res.status(200).json(vehiclesWithImages);
  } catch (error) {
    console.error("Error fetching non-certified vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getVehiclesById = async (req, res) => {
  try {
    const id = req.params.id;
    const { search } = req.query;

    let query = `
      SELECT        
        b.id AS bidId,
        b.userId AS bidUserId,
        b.vehicleId AS bidVehicleId,
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
      LEFT JOIN tbl_bid b ON v.id = b.vehicleId
      LEFT JOIN tbl_users u ON u.id = b.userId
      WHERE v.vehicleStatus = 'Y' AND v.id = ?
        AND (u.role = 'seller' OR u.role = 'admin' OR u.role IS NULL)
    `;

    const params = [id];

    if (search) {
      query += ` AND (v.make LIKE ? OR v.model LIKE ? OR v.series LIKE ? OR v.bodyStyle LIKE ? OR v.color LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [vehicles] = await pool.query(query, params);

    if (!vehicles.length) {
      return res.status(404).json({ message: "No vehicles found" });
    }

    const vehiclesWithImages = vehicles.map((vehicle) => {
      const processedVehicle = { ...vehicle };

      // price formatting
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

      // cloudinary images
      try {
        if (vehicle.image) {
          const parsed = JSON.parse(vehicle.image);
          if (Array.isArray(parsed)) {
            processedVehicle.images = parsed.map((publicId) =>
              getPhotoUrl(publicId, {
                width: 400,
                crop: "thumb",
                quality: "auto",
              })
            );
          } else {
            processedVehicle.images = [];
          }
        } else {
          processedVehicle.images = [];
        }
      } catch {
        processedVehicle.images = [];
      }

      delete processedVehicle.image;

      if (vehicle.bidId) {
        processedVehicle.startTime = vehicle.startTime
          ? moment.utc(vehicle.startTime).toISOString()
          : null;
        processedVehicle.endTime = vehicle.endTime
          ? moment.utc(vehicle.endTime).toISOString()
          : null;
      }

      return processedVehicle;
    });

    return res.status(200).json({ ...vehiclesWithImages[0] });
  } catch (error) {
    console.error("Failed to fetch vehicle by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const bidsPlacedById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Please provide the ID" });
    }

    const [result] = await pool.query(
      `SELECT        
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
      WHERE b.status = 'Y'
        AND b.vehicleId = ?
      ORDER BY b.createdAt ASC
    `,
      [id]
    );

    if (!result.length) {
      return res
        .status(404)
        .json({ message: "No bids found for this vehicle" });
    }

    const formattedResult = result.map((row) => {
      // Format prices safely
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
          const parsed = JSON.parse(row.image); // Expected: ["id1", "id2", ...]
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
        startTime: moment.utc(row.startTime).toISOString(),
        endTime: moment.utc(row.endTime).toISOString(),
        images: cloudinaryImages,
      };
    });

    // console.log(
    //   "Emitting to room",
    //   `vehicle_${id}`,
    //   Array.from(await io.in(`vehicle_${id}`).allSockets())
    // );

    // io.to(`vehicle_${id}`).emit("bidUpdate", {
    //   vehicleId: id,
    //   latestBid: formattedResult[0],
    // });

    return res.status(200).json(formattedResult);
  } catch (err) {
    console.error("Failed to fetch bidsPlacedById:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const purchasedVehicleData = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).send({
        message: "Please provide id of the vehicle!",
      });
    }

    const [result] = await pool.query(
      `SELECT
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
                u.role,
                b.maxBid,
                b.MonsterBid,
                b.winStatus,
                b.id AS bidId 
            FROM tbl_vehicles v
            JOIN tbl_bid b ON v.id = b.vehicleId
            JOIN tbl_users u ON u.id = b.userId
            WHERE b.status = 'Y' AND winStatus = 'Won' AND role = 'customer' AND b.vehicleId = ?`,
      [id]
    );

    if (result.length === 0) {
      return res.status(404).send({
        message: "No purchasing data for this vehicle found!",
      });
    }

    const formattedResult = result.map((row) => {
      // Format prices safely
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
          const parsed = JSON.parse(row.image); // Expected: ["id1", "id2", ...]
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
    console.error("Failed to fetch purchased vehicle data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
