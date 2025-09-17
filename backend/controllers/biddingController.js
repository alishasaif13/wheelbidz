import express from "express";
import pool from "../config/db.js";
import { getTimeDifference } from "../utils/timeFormat.js";
import moment from "moment-timezone";
import cron from "node-cron";
import { io } from "../socket.js";


export const createBid = async (req, res) => {
  try {
    const { userId, vehicleId, sellerOffer, startTime, endTime, saleStatus } =
      req.body;

    if (!userId || !vehicleId || !saleStatus || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //  Format datetime correctly
    const formattedStartTime = new Date(startTime)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const formattedEndTime = new Date(endTime)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    //  Check if bid already exists
    const [existingBid] = await pool.query(
      `SELECT * FROM tbl_bid WHERE userId = ? AND vehicleId = ?`,
      [userId, vehicleId]
    );

    if (existingBid.length > 0) {
      return res
        .status(400)
        .json({ message: "Bid already exists for this vehicle" });
    }

    // Get buyNowPrice
    const [vehicleRows] = await pool.query(
      `SELECT buyNowPrice FROM tbl_vehicles WHERE id = ?`,
      [vehicleId]
    );

    if (vehicleRows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const theBidPrice = vehicleRows[0].buyNowPrice;

    // Insert bid
    const [insertResult] = await pool.query(
      `INSERT INTO tbl_bid (userId, vehicleId, sellerOffer, startTime, endTime, saleStatus) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        vehicleId,
        sellerOffer,
        formattedStartTime,
        formattedEndTime,
        saleStatus,
      ]
    );

    const bidId = insertResult.insertId;

    // Update bid (auctionStatus + sellerOffer)
    await pool.query(
      `UPDATE tbl_bid SET auctionStatus = 'upcoming', sellerOffer = ? WHERE id = ?`,
      [theBidPrice, bidId]
    );

    // Update vehicle saleStatus
    await pool.query(
      `UPDATE tbl_vehicles SET saleStatus = 'upcoming' WHERE id = ?`,
      [vehicleId]
    );

    // Get the created bid + vehicle info
    const [bid] = await pool.query(
      `SELECT v.*, b.* FROM tbl_bid b
       JOIN tbl_vehicles v ON v.id = b.vehicleId
       WHERE b.id = ?`,
      [bidId]
    );

    const formatted = bid.map((r) => ({
      ...r,
      startTime: new Date(r.startTime).toISOString().replace(/\.\d{3}Z$/, "Z"),
      endTime: new Date(r.endTime).toISOString().replace(/\.\d{3}Z$/, "Z"),
    }));

    res
      .status(201)
      .json({ message: "Bid created successfully", ...formatted[0] });
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCreateBid = async (req, res) =>{
  try{
    const id = req.params.id;
    const { userId, vehicleId, startTime, endTime, saleStatus } = req.body;
    const requiredFields = ["userId", "vehicleId", "startTime", "endTime", "saleStatus"];

    const missingField = requiredFields.filter(field=> !req.body[requiredFields]);

    if(missingField.lenght > 0){
      return res.status(400).send({message: `Mssing ${missingField}`});
    }

    const [update] = await pool.query(`update tbl_bid set userId = ?, vehicleId = ?, startTime = ?, endTime = ?, saleStatus = ? where id = ?`,
      [userId, vehicleId, startTime, endTime, saleStatus, id]
    );

    if(update.affectedRows < 0){
      return res.status(404).send({message: "Unable to update Bid!"});
    }

    const [updateBid] = await pool.query(`select * from tbl_bid where id = ?`,
      [id]
    );

    res.status(200).send({...updateBid[0]});

  }catch(error){
    res.status(500).send({message: "Internal Server Error!"});
    console.error({error: error.message});
  }
};

export const startBidding = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { userId, vehicleId, maxBid, monsterBid } = req.body;
    console.log("Bid request:", req.body);

    if (!userId || !vehicleId || (!maxBid && !monsterBid)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message:
          "userId, vehicleId, and either maxBid or monsterBid are required.",
      });
    }

    const [rows] = await pool.query(`select * from tbl_bid where vehicleId = ? order by createdAt desc`, [vehicleId]);

    const highprice = rows[0].MonsterBid;

    if(highprice >= monsterBid){
      res.status(404).send({message: "Please Enter a greater amount than the last entry!"});
      return;
    }

    console.log("userID: ->",rows[0].MonsterBid);

    if (maxBid && monsterBid) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Cannot submit both maxBid and monsterBid",
      });
    }

    const yourOffer = maxBid || monsterBid;
    const bidType = maxBid ? "Max Bid" : "Monster Bid";

    const [vehicle] = await connection.query(
      'SELECT * FROM tbl_vehicles WHERE id = ? AND vehicleStatus = "Y"',
      [vehicleId]
    );

    if (vehicle.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or not available for bidding",
      });
    }

    const [currentBids] = await connection.query(
      "SELECT * FROM tbl_bid WHERE vehicleId = ?",
      [vehicleId]
    );

    if (currentBids.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No active auction found for this vehicle",
      });
    }

    const saleStatus = currentBids[0].saleStatus;
    const bidApprStatus = currentBids[0].bidApprStatus;

    if (bidApprStatus === "completed") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Bidding is already completed for this vehicle",
      });
    }

    const [insertBid] = await connection.query(
      `INSERT INTO tbl_bid
        (userId, vehicleId, yourOffer, maxBid, monsterBid, saleStatus, bidApprStatus, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, vehicleId, yourOffer, maxBid, monsterBid, saleStatus, "ongoing"]
    );

    const [newBid] = await connection.query(
      `SELECT v.*, b.*, u.name
       FROM tbl_bid b
       JOIN tbl_vehicles v ON v.id = b.vehicleId
       JOIN tbl_users u ON u.id = b.userId
       WHERE b.id = ?`,
      [insertBid.insertId]
    );

    const id = newBid[0].vehicleId;
    console.log(id);

    const [updatedBids] = await connection.query(
      `SELECT b.*, u.name
       FROM tbl_bid b
       JOIN tbl_users u ON u.id = b.userId
       WHERE b.vehicleId = ?
       ORDER BY b.id DESC`,
      [vehicleId]
    );

    await connection.query(
      'UPDATE tbl_bid SET auctionStatus = "live" WHERE vehicleId = ?',
      [vehicleId]
    );

    console.log(
      "Emitting to room",
      `vehicle_${id}`,
      Array.from(await io.in(`vehicle_${id}`).allSockets())
    );
 
    io.to(`vehicle_${id}`).emit("bidUpdate", {
      vehicleId: id,
      latestBid: newBid[0]
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `${bidType} of $${yourOffer} placed successfully`,
      bid: newBid[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in startBidding:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process bid",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

export const endBidding = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("function called");

    // 1. Check if bid exists
    const [bid] = await connection.query(`SELECT * FROM tbl_bid WHERE id = ?`, [id]);
    if (bid.length === 0) {
      await connection.rollback();
      return { success: false, message: "Bid not found" };
    }

    const vehicleID = bid[0].vehicleId;

    // 2. Mark bids as completed
    const [update] = await connection.query(
      `UPDATE tbl_bid SET bidApprStatus = ? WHERE vehicleId = ?`,
      ["completed", vehicleID]
    );
    if (update.affectedRows === 0) {
      await connection.rollback();
      return { success: false, message: "Failed to update bids" };
    }

    // 3. Get the winning customer bid (highest MonsterBid)
    const [result] = await connection.query(
      `SELECT b.MonsterBid, b.userId, b.vehicleId, b.id, u.role
       FROM tbl_bid b
       JOIN tbl_users u ON b.userId = u.id
       WHERE b.vehicleId = ?
         AND b.MonsterBid = (
           SELECT MAX(MonsterBid)
           FROM tbl_bid
           WHERE vehicleId = ?
         )
         AND u.role = 'customer'`,
      [vehicleID, vehicleID]
    );
    if (result.length === 0) {
      await connection.rollback();
      return { success: false, message: "No customer bids found for this vehicle" };
    }

    const winnerId = result[0].userId;
    const bidId = result[0].id;

    // 4. Mark winner (only this one customer)
    await connection.query(
      `UPDATE tbl_bid 
       SET winStatus = 'Won' 
       WHERE userId = ? AND vehicleId = ? AND id = ?`,
      [winnerId, vehicleID, bidId]
    );

    // 5. Mark all other CUSTOMERS as "Lost"
    await connection.query(
      `UPDATE tbl_bid b
       JOIN tbl_users u ON b.userId = u.id
       SET b.winStatus = 'Lost'
       WHERE b.vehicleId = ? 
         AND b.userId != ? 
         AND u.role = 'customer'`,
      [vehicleID, winnerId]
    );

    // 6. Update auction + vehicle status
    await connection.query(
      `UPDATE tbl_bid SET auctionStatus = 'end', saleStatus = 'sold' WHERE vehicleId = ?`,
      [vehicleID]
    );
    await connection.query(
      `UPDATE tbl_vehicles SET saleStatus = 'sold' WHERE id = ?`,
      [vehicleID]
    );

    // 7. Get winning row
    const [getWinner] = await connection.query(
      `SELECT * FROM tbl_bid WHERE vehicleId = ? AND winStatus = 'Won' LIMIT 1`,
      [vehicleID]
    );
    const winnerRow = getWinner[0];

    // 8. Ensure correct maxBid/MonsterBid values
    if (winnerRow?.maxBid != null) {
      await connection.query(`UPDATE tbl_bid SET maxBid = ? WHERE id = ?`, [
        winnerRow.maxBid,
        winnerRow.id,
      ]);
    }
    if (winnerRow?.MonsterBid != null) {
      await connection.query(`UPDATE tbl_bid SET monsterBid = ? WHERE id = ?`, [
        winnerRow.MonsterBid,
        winnerRow.id,
      ]);
    }

    // 9. Join with user details (like API 1)
    const [finalWinner] = await pool.query(
      `SELECT b.*, u.name, u.email, u.contact, u.role
       FROM tbl_bid b
       JOIN tbl_users u ON u.id = b.userId
       WHERE b.vehicleId = ? AND b.winStatus = 'Won'`,
      [vehicleID]
    );

    await connection.commit();
    return { success: true, winner: finalWinner[0] };
  } catch (error) {
    await connection.rollback();
    console.error("Error ending bidding:", error);
    return { success: false, message: "Internal server error", error: error.message };
  } finally {
    connection.release();
  }
};

// export const endBidding = async (req, res) => {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     const id = req.params.id;

//     // Check if the bid exists
//     const [bid] = await connection.query(`SELECT * FROM tbl_bid WHERE id = ?`, [
//       id,
//     ]);

//     if (bid.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Bid not found",
//       });
//     }

//     const vehicleID = bid[0].vehicleId;

//     // Update all bids for this vehicle
//     const [update] = await connection.query(
//       `UPDATE tbl_bid SET bidApprStatus = ? WHERE vehicleId = ?`,
//       ["completed", vehicleID]
//     );

//     if (update.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Failed to update bids",
//       });
//     }

//     const [result] = await connection.query(
//      `SELECT b.MonsterBid, b.userId, b.vehicleId, b.id
//       FROM tbl_bid b
//       WHERE b.vehicleId = ?
//         AND b.MonsterBid = (
//           SELECT MAX(MonsterBid)
//           FROM tbl_bid
//           WHERE vehicleId = ?
//         )`,
//       [vehicleID, vehicleID]
//     );

//     console.log(result);

//     if (result.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "No bids found for this vehicle",
//       });
//     }

//     const winnerId = result[0].userId;
//     const bidId = result[0].id;

//     console.log("bidId", bidId);  

//     await connection.query(
//       `
//             UPDATE tbl_bid
//             SET winStatus = 'Won'
//             WHERE userId = ? AND vehicleId = ? AND id = ?
//         `,
//       [winnerId, vehicleID, bidId]
//     );

//     await connection.query(
//       `
//             UPDATE tbl_bid
//             SET winStatus = 'Lost'
//             WHERE userId != ? AND vehicleId = ?
//         `,
//       [winnerId, vehicleID]
//     );

//     const [updatedBids] = await connection.query(
//       `
//             SELECT * FROM tbl_bid
//             WHERE vehicleId = ?
//         `,
//       [vehicleID]
//     );

//     const [final] = await pool.query(
//       `select b.*, u.name, u.email, u.contact, u.role 
//         from tbl_bid b join 
//         tbl_users u on 
//         u.id = b.userId
//         where vehicleId = 3 and  winStatus = 'Won'`,
//       [vehicleID]
//     );

//     const [getWonPeroson] = await connection.query(
//       `select * from tbl_bid where vehicleId = ? and winStatus = 'Won'`,
//       [vehicleID]
//     );
  
    
//     await connection.query(
//       `UPDATE tbl_bid SET auctionStatus = 'end', saleStatus = 'sold' WHERE vehicleId = ?`,
//       [vehicleID]
//     );

//     await connection.query(
//       `UPDATE tbl_vehicles SET saleStatus = 'sold' WHERE id = ?`,
//       [vehicleID]
//     );

//     // 2. Correctly update the winning bid row
//     const winnerRowId = getWonPeroson[0].id;

//     if (getWonPeroson[0].maxBid != null) {
//       await connection.query(`UPDATE tbl_bid SET maxBid = ? WHERE id = ?`, [
//         getWonPeroson[0].maxBid,
//         id,
//       ]);
//     }

//     if (getWonPeroson[0].MonsterBid != null) {
//       await connection.query(`UPDATE tbl_bid SET monsterBid = ? WHERE id = ?`, [
//         getWonPeroson[0].MonsterBid,
//         id,
//       ]);
//     }

//     await connection.commit();

//     res.status(200).json({
//       ...final[0],
//     });
//   } catch (error) {
//     await connection.rollback();
//     console.error("Error ending bidding:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   } finally {
//     connection.release();
//   }
// };

export const totalVehicles = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select count(*) as totalVehicles from tbl_vehicles where vehicleStatus = 'Y'`
    );

    res.status(200).json({ totalVehicles: query[0].totalVehicles });
  } catch (error) {
    console.error("Error fetching total vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const totalLiveAuctions = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select count(*) as totalLiveAuctions from tbl_bid b
        join tbl_users u on u.id = b.userId
        join tbl_vehicles v on
        b.vehicleId = v.id
        WHERE
        b.auctionStatus = 'live'
        AND v.vehicleStatus = 'Y'
        AND (u.role = 'seller' OR u.role = 'admin')`
    );
    res.status(200).json({ totalLiveAuctions: query[0].totalLiveAuctions });
  } catch (error) {
    console.error("Error fetching total vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const totalBidsPlaced = async (req, res) => {
  try {
    const [query] = await pool.query(`SELECT COUNT(*) AS totalBidsPlaced
              FROM tbl_users u
              LEFT JOIN tbl_bid bd ON bd.userId = u.id
              WHERE bd.auctionStatus = 'live' AND bd.status = 'Y' and u.role = 'customer'`);
    res.status(200).json({ totalBidsPlaced: query[0].totalBidsPlaced });
  } catch (error) {
    console.error("Error fetching total vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const totalUsers = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select count(*) as totalUsers from tbl_users where status = 'Y'`
    );
    res.status(200).json({ totalUsers: query[0].totalUsers });
  } catch (error) {
    console.error("Error fetching total vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateBidStatusAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const auctionStatus = "live";

    if (!auctionStatus || !id) {
      return res
        .status(400)
        .json({ message: "Auction status or Id is missing!" });
    }

    const [updateQuery] = await pool.query(
      `UPDATE tbl_bid SET auctionStatus = ? WHERE id = ?`,
      [auctionStatus, id]
    );

    if (updateQuery.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Bid not found or no changes made" });
    }
    const [updatedBid] = await pool.query(
      `SELECT * FROM tbl_bid WHERE id = ?`,
      [id]
    );

    res.status(200).json({ ...updatedBid[0] });
  } catch (error) {
    console.error("Error updating bid status:", error);
    res.status(500).json({ message: "Internal server error" });
    res.send({ error: error.message });
  }
};

export const autoUpdateToLive = async (req, res) => {
  try {
    const [bids] = await pool.query(
      `select * from tbl_bid where auctionStatus = 'upcoming' and startTime = NOW()`
    );
    if (bids.length === 0) {
      return res
        .status(404)
        .json({ message: "No bids found to update to live" });
    } else {
      await Promise.all(
        bids.map(async (bid) => {
          const [updateQuery] = await pool.query(
            `UPDATE tbl_bid SET auctionStatus = 'live' WHERE id = ?`,
            [bid.id]
          );
          if (updateQuery.affectedRows === 0) {
            console.error(`Bid with ID ${bid.id} not found or no changes made`);
          }
        })
      );
      res.status(200).json({ message: "Bids updated to live successfully" });
    }
  } catch (error) {
    {
      console.error("Error updating to live:", error);
      res.status(500).json({ message: "Internal server error" });
      res.send({ error: error.message });
    }
  }
};

export const bidStartEnd = async (req, res) => {
  try {
    await pool.query("SET time_zone = '+05:30'");

    await pool.query(`
      UPDATE tbl_bid
      SET auctionStatus = 'live'
      WHERE DATE(startTime) = CURDATE()
        AND startTime <= NOW()
        AND auctionStatus = 'upcoming'
    `);

    const [futureBids] = await pool.query(`
      SELECT id, startTime
      FROM tbl_bid
      WHERE DATE(startTime) = CURDATE()
        AND startTime > NOW()
        AND auctionStatus = 'upcoming'
    `);

    futureBids.forEach((bid) => {
      const timeDiff = getTimeDifference(bid.startTime);

      if (timeDiff.totalSeconds > 0) {
        console.log(
          `Scheduling bid #${bid.id} to go live in ${timeDiff.totalSeconds} seconds`
        );

        setTimeout(async () => {
          try {
            await pool.query(
              `UPDATE tbl_bid SET auctionStatus = 'live' WHERE id = ?`,
              [bid.id]
            );
            console.log(`Bid #${bid.id} is now live`);
          } catch (err) {
            console.error(`Failed to activate bid #${bid.id}:`, err);
          }
        }, timeDiff.totalSeconds * 1000);
      }
    });

    const [liveBids] = await pool.query(`
      SELECT id, endTime
      FROM tbl_bid
      WHERE DATE(startTime) = CURDATE()
        AND auctionStatus = 'live'
    `);

    liveBids.forEach(async (bid) => {
      const timeToEnd = getTimeDifference(bid.endTime);

      if (timeToEnd.totalSeconds > 0) {
        console.log(
          `Scheduling bid #${bid.id} to end in ${timeToEnd.totalSeconds} seconds`
        );

        setTimeout(async () => {
          try {
            await pool.query(
              `UPDATE tbl_bid SET auctionStatus = 'end' WHERE id = ?`,
              [bid.id]
            );
            console.log(`Bid #${bid.id} is now ended`);
          } catch (err) {
            console.error(`Failed to end bid #${bid.id}:`, err);
          }
        }, timeToEnd.totalSeconds * 1000);
      } else {
        try {
          console.log(
            `Bid #${bid.id} already past its endTime. Consider immediate update.`
          );
          await pool.query(
            `UPDATE tbl_bid SET auctionStatus = 'end' WHERE id = ?`,
            [bid.id]
          );
        } catch (error) {
          console.error("Error updating to end in the else condition:", error);
          res.status(500).json({ message: "Internal server error" });
          res.send({ error: error.message });
        }
      }
    });

    return res.status(200).json({
      message: "Bids updated, scheduled to start, and scheduled to end",
      nowActivated: "Past-start bids are now live",
      scheduledStartCount: futureBids.length,
      scheduledEndCount: liveBids.length,
    });
  } catch (error) {
    console.error("Error in bidStartEnd:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const totalUpcomingAuctions = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select count(*) as totalUpcomingAuctions from tbl_bid b
        join tbl_users u on u.id = b.userId
        join tbl_vehicles v on
        b.vehicleId = v.id
        WHERE
        b.auctionStatus = 'upcoming'
        AND v.vehicleStatus = 'Y'
        AND (u.role = 'seller' OR u.role = 'admin')`
    );
    res
      .status(200)
      .json({ totalUpcomingAuctions: query[0].totalUpcomingAuctions });
  } catch (error) {
    console.error("Error fetching total vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const totalSellers = async (req, res) => {
  try {
    const [query] = await pool.query(
      `SELECT COUNT(*) AS totalSellers
       FROM tbl_users
       WHERE status = 'Y' AND role = 'seller'`
    );

    res.status(200).json({ totalSellers: query[0].totalSellers });
  } catch (error) {
    console.error("Error fetching total sellers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const bidHistoryCount = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select count(*) as endedBidCount from tbl_bid b
        join tbl_users u on u.id = b.userId
        join tbl_vehicles v on
        b.vehicleId = v.id
        WHERE
        b.auctionStatus = 'end'
        AND v.vehicleStatus = 'Y'
        AND (u.role = 'seller' OR u.role = 'admin')`
    );

    res.status(200).json({ endedBidCount: query[0].endedBidCount });
  } catch (error) {
    console.error("Error fetching ended Bid Count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const totalBuyers = async (req, res) => {
  try {
    const [query] = await pool.query(
      `select count(*) as totalBuyers from tbl_users where status = 'Y' and role = 'customer'`
    );
    res.status(200).json({ totalBuyers: query[0].totalBuyers });
  } catch (error) {
    console.error("Error fetching total vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

let cronStarted = false;

export const bidStartEnds = async (req, res) => {
  try {
    if (!cronStarted) {
      cron.schedule("* * * * * *", async () => {
        try {
          // Step 1: Get DB timezone
          const [tzResult] = await pool.query(
            `SELECT @@global.time_zone AS globalTZ, @@session.time_zone AS sessionTZ`
          );

          let dbTimeZone = tzResult[0].sessionTZ || tzResult[0].globalTZ;

          // If SYSTEM, compute offset manually
          if (dbTimeZone === "SYSTEM") {
            const [sysTime] = await pool.query(
              `SELECT TIMEDIFF(NOW(), UTC_TIMESTAMP) AS time_offset`
            );

            const offset = sysTime[0].time_offset;
            dbTimeZone = offset.startsWith("-")
              ? offset.substring(0, 6)
              : `+${offset.substring(0, 5)}`;
          }

          // console.log("Database TimeZone Detected:", dbTimeZone);

          // Step 2: Get active bids
          const [bids] = await pool.query(`
            SELECT id, startTime, endTime, auctionStatus
            FROM tbl_bid
            WHERE auctionStatus IN ('upcoming', 'live')
          `);

          // Current Karachi time
          const now = moment().tz("Asia/Karachi");

          for (const bid of bids) {
            if (!bid.startTime || !bid.endTime) {
              // console.log(`Skipping Bid ${bid.id}: null start/end time`);
              continue;
            }

            // Step A: interpret DB times in DB timezone
            const startInDbTz = moment.tz(bid.startTime, dbTimeZone);
            const endInDbTz = moment.tz(bid.endTime, dbTimeZone);

            // Step B: convert to Karachi timezone
            const start = startInDbTz.clone().tz("Asia/Karachi");
            const end = endInDbTz.clone().tz("Asia/Karachi");

            if (!start.isValid() || !end.isValid()) {
              // console.log(`Skipping Bid ${bid.id}: invalid dates`);
              continue;
            }

            // Transition logic
            if (now.isSameOrAfter(start) && bid.auctionStatus === "upcoming") {
              await pool.query(
                `UPDATE tbl_bid SET auctionStatus = 'live' WHERE id = ?`,
                [bid.id]
              );
              console.log(`Bid ${bid.id} updated to LIVE`);
            }

            if (now.isSameOrAfter(end) && bid.auctionStatus === "live") {
              await pool.query(
                `UPDATE tbl_bid SET auctionStatus = 'end' WHERE id = ?`,
                [bid.id]
              );
              await endBidding(bid.id);
              console.log(`Bid ${bid.id} updated to END`);
            }

            // console.log(
            //   `Bid ${bid.id} | Start: ${start.format()} | End: ${end.format()} | Now: ${now.format()}`
            // );
          }
        } catch (err) {
          console.error("Error in cron job:", err.message);
        }
      });
      cronStarted = true; 
    }

    return res.status(200).json({
      message:
        "Cron started: it will check every 40 seconds and update auction statuses.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
    console.error("Controller error:", err.message);
  }
};

export const getUsers = async (req, res) => {
  try{

    // await pool.query(`SET FOREIGN_KEY_CHECKS = 0`);
    // const [rows] = await pool.query("select * FROM tbl_suggestions");
    const [rows] = await pool.query("delete from tbl_users where email in ('ammaramjad53@gmail.com', 'owaisansarcodm@gmail.com', 'hamzaamin104@gmail.com', 'dmughal908@gmail.com', 'hamzaamintechnicmentors@gmail.com', 'owaisansar00x@gmail.com', 'owaisansarcodm@gmail.com')");
    // const [rows] = await pool.query(`alter table tbl_series 
    // add column brandId int not  null after modelId`);
    // await pool.query(`SET FOREIGN_KEY_CHECKS = 1`);
    
//     const [rows] = await pool.query(`CREATE TABLE tbl_suggestions (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     name VARCHAR(100) NULL,
//     email VARCHAR(150) NULL,
//     contactNumber VARCHAR(20) NULL,
//     suggestion TEXT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// )`);

    // const [rows] = await pool.query(`alter table tbl_series add column modelId int not null after brandId`);

    // res.status(200).send({message: "done is"});
    // let rows = 0;
    // for(let i = 0; i<100; i++){
    //   rows = await endBidding(99);
    // }
    // const [rows] = await pool.query(`ALTER TABLE tbl_users MODIFY contact VARCHAR(255) NULL`);
    // const [rows] = await pool.query(`ALTER TABLE tbl_users MODIFY name VARCHAR(255) NULL`);
    // const [rows] = await pool.query(`alter  table tbl_users add column emailVerifStatus enum ('active', 'Non-Active') default 'Non-Active'`);
    res.status(200).send(rows);
  }catch(error){
    res.status(500).send({message: "Internal Server Error!"});
    console.error({error: error.message});
  }
};

export const truncateData = async (req, res) => {
  try {
    await pool.query(`SET FOREIGN_KEY_CHECKS = 0`);
    // // await pool.query(`TRUNCATE TABLE tbl_bid`);
    // await pool.query(`TRUNCATE TABLE tbl_vehicles`);
    // await pool.query(`TRUNCATE TABLE tbl_users`);
    await pool.query(`TRUNCATE TABLE tbl_calender`);

    
    // await pool.query(`delete from tbl_users where id = 4`);
    
    await pool.query(`SET FOREIGN_KEY_CHECKS = 1`);

    res.status(200).send({
      message: "Tables truncated successfully!",
      // truncated: ["tbl_bid", "tbl_vehicles", "tbl_users"]
    });
  } catch (error) {
    console.error("Truncate Error:", error.message);
    res.status(500).send({
      message: "Internal Server Error while truncating!",
      error: error.message
    });
  }
};