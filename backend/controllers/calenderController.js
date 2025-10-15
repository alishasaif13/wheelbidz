import express from "express";
import pool from "../config/db.js";

export const addCalenderEvent = async (req, res) => {
  try {
    const [vehicles] = await pool.query(
      `SELECT v.locationId, b.vehicleId as id, date(b.startTime) as auctionDate
       FROM tbl_vehicles v
       join tbl_bid b on
       v.id = b.vehicleId
       join tbl_users u on
       u.id = b.userId
       WHERE v.vehicleStatus = 'Y'
       AND (u.role = 'seller' OR u.role = 'admin')`
    );

    if (!vehicles.length) {
      return res.status(404).json({
        success: false,
        message: "No active vehicles found",
      });
    }

    const insertedEvents = [];

    for (const vehicle of vehicles) {
      const date = vehicle.auctionDate;
      const location = vehicle.locationId;
      const vehicleId = vehicle.id;

      const [existing] = await pool.query(
        `SELECT id FROM tbl_calender WHERE vehicleId = ? LIMIT 1`,
        [vehicleId]
      );

      if (existing.length > 0) {
        console.log(
          `Vehicle ${vehicleId} already exists in calendar, skipping...`
        );
        continue;
      }

      const [rows] = await pool.query(`SELECT DAYNAME(?) as day`, [date]);
      const day = rows[0].day;

      const locationJson = JSON.stringify(location);

      console.log(day, date, location);

      const [insertCalendarEvent] = await pool.query(
        `INSERT INTO tbl_calender (date, day, location, vehicleId)
         VALUES (?, ?, ?, ?)`,
        [date, day, locationJson, vehicleId]
      );

      const [result] = await pool.query(
        `SELECT * FROM tbl_calender WHERE id = ?`,
        [insertCalendarEvent.insertId]
      );

      insertedEvents.push({
        ...result[0],
        location: JSON.parse(result[0].location),
      });
    }

    console.log("Calendar events added:", insertedEvents);

    res.status(200).json(insertedEvents);
  } catch (error) {
    console.error("Error adding calendar events:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getCalenderEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        t.date,
        t.day,
        JSON_ARRAYAGG(t.location) AS location
      FROM (
        SELECT DISTINCT date, day, JSON_UNQUOTE(location) AS location
        FROM tbl_calender
        WHERE status = 'Y'
          AND date >= CURDATE()
      ) AS t
      GROUP BY t.date, t.day`
    );

    if (!rows || rows.length === 0) {
      return;
    }

    const normalizeAndDedupe = (arrLike) => {
      // turn the DB value into an array safely
      let arr = arrLike;
      if (typeof arrLike === "string") {
        try {
          arr = JSON.parse(arrLike);
        } catch {
          arr = [arrLike];
        }
      }
      if (!Array.isArray(arr)) arr = arr == null ? [] : [String(arr)];

      const seen = new Set();
      const out = [];
      for (const val of arr) {
        if (val == null) continue;
        const s = String(val).trim();
        if (!s) continue;
        const key = s.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(s); // keep original casing of first occurrence
        }
      }
      return out;
    };

    const result = rows.map(({ date, day, location }) => ({
      date,
      day,
      location: normalizeAndDedupe(location),
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updateCalenderEvent = async (req, res) => {
  try {
    const id = req.params.id;
    const { date, day, location } = req.body;

    console.log(req.body);

    // Validate required fields
    const requiredFields = ["date", "day", "location"];

    const locationJson = JSON.stringify(location);

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const [query] = await pool.query(
      `update tbl_calender set userId = ?, vehicleId = ?, date = ?, day = ?, location = ? where id = ?`,
      [date, day, locationJson, id]
    );

    const [result] = await pool.query(
      `select * from tbl_calender where id = ?`,
      [id]
    );

    res.status(200).json({
      ...result[0],
    });
  } catch (error) {
    console.error(" Error updating calendar event:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteCalenderEvent = async (req, res) => {
  try {
    const id = req.params.id;
    // Check if calendar event exists
    const [event] = await pool.query(
      "SELECT * FROM tbl_calender WHERE id = ?",
      [id]
    );

    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    await pool.query(`update tbl_calender set status = 'N' where id = ?`, [id]);

    const [getDeleted] = await pool.query(
      `select * from tbl_calender where id = ?`,
      [id]
    );

    res.status(200).json({
      ...getDeleted[0],
      message: "Calendar event deleted successfully",
    });
  } catch (error) {
    console.error(" Error deleting calendar event:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
