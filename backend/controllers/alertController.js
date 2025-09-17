import express from  'express';
import pool from '../config/db.js';
import nodemailer from 'nodemailer';



export const createAlert = async (req, res) => {
    try {
        const { userId,
            vehicleType,
            make,
            model,
            minPrice,
            maxPrice,
            minYear,
            maxYear,
            fuelType,
            transmissionType,
            colorPreference } = req.body;

            if(!userId || !vehicleType || !make || !model || !minPrice || !maxPrice || !minYear || !maxYear || !fuelType || !transmissionType || !colorPreference) {
                return res.status(400).json({ message: "All fields are required" });
            }

            const [create] = await pool.query(`insert into tbl_vehicle_requests (userId, vehicleType, make, model, minPrice, maxPrice, minYear, maxYear, fuelType, transmissionType, colorPreference) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, vehicleType, make, model, minPrice, maxPrice, minYear, maxYear, fuelType, transmissionType, colorPreference]
            );

            const id = create.insertId;

            const [alert] = await pool.query(`select vr.*, u.name, u.email
            from tbl_vehicle_requests vr
            join tbl_users u on 
            vr.userId = u.id WHERE vr.id = ?`, [id]);
            res.status(201).json({message: "Alert created successfully",
                ...alert[0]
             });
            

    } catch (error) {
        console.error("Error creating alert:", error);
        res.status(500).json({ message: "Internal server error" });
        
    }
}






export const sendAlert = async (req, res) => {
  try {
    const { requestId } = req.body;
    console.log('Request ID:', requestId);
    
    // Step 1: Verify environment variables are loaded
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error('Email credentials not configured in environment variables');
    }

    // Step 2: Fetch request + user email
    const [requestData] = await pool.query(`
      SELECT vr.*, u.name, u.email 
      FROM tbl_vehicle_requests vr 
      JOIN tbl_users u ON u.id = vr.userId 
      WHERE vr.id = ?
    `, [requestId]);

    if (requestData.length === 0) {
      return res.status(404).json({ message: 'Vehicle request not found.' });
    }

    const request = requestData[0];

    const baseConditions = [
      'vehicleType = ?',
      'make = ?',
      'model = ?',
      'year BETWEEN ? AND ?',
      'buyNowPrice BETWEEN ? AND ?',
      'color = ?'
    ];
    
    const queryParams = [
      request.vehicleType,
      request.make,
      request.model,
      request.minYear,
      request.maxYear,
      request.minPrice,
      request.maxPrice,
      request.colorPreference
    ];
    
    if (request.fuelType) {
      baseConditions.push('fuelType = ?');
      queryParams.push(request.fuelType);
    }
    
    const sql = `
      SELECT * FROM tbl_vehicles
      WHERE ${baseConditions.join(' AND ')}
      ORDER BY 
        CASE WHEN userId = ? THEN 0 ELSE 1 END,
        buyNowPrice ASC
    `;
    
    queryParams.push(request.userId);
    
    const [matchedVehicles] = await pool.query(sql, queryParams);
    
    
    if (matchedVehicles.length === 0) {
      return res.status(200).json({ message: 'No matching vehicles found.' });
    }

    // Step 4: Configure email transporter with secure options
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Only for development/testing
      }
    });

    // Step 5: Verify connection configuration
await new Promise((resolve, reject) => {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP connection error:', error);
      return reject(new Error('Failed to verify SMTP configuration'));
    } else {
      console.log('Server is ready to take our messages');
      resolve(success);
    }
  });
});


    // Step 6: Prepare email content
    const mailOptions = {
      from: `"Copart Auto Alerts" <${process.env.MAIL_USER}>`,
      to: request.email,
      subject: `🚗 Vehicle Available: ${request.make} ${request.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">Vehicle Match Alert!</h2>
          <p>Hi ${request.name},</p>
          <p>We found ${matchedVehicles.length} vehicle(s) matching your preferences:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Request Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Type:</strong> ${request.vehicleType}</li>
              <li><strong>Make/Model:</strong> ${request.make} ${request.model}</li>
              <li><strong>Year Range:</strong> ${request.minYear} - ${request.maxYear}</li>
              <li><strong>Price Range:</strong> $${request.minPrice} - $${request.maxPrice}</li>
              ${request.fuelType ? `<li><strong>Fuel Type:</strong> ${request.fuelType}</li>` : ''}
              ${request.transmissionType ? `<li><strong>Transmission:</strong> ${request.transmissionType}</li>` : ''}
            </ul>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="https://pakwheels.com/" 
               style="background: #0066cc; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px;">
              View Matching Vehicles
            </a>
          </p>

          <p style="font-size: 12px; color: #777; margin-top: 30px;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      `
    };

    // Step 7: Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    res.status(200).json({ 
      success: true,
      message: 'Alert email sent successfully.',
      details: {
        email: request.email,
        vehiclesFound: matchedVehicles.length
      }
    });

  } catch (error) {
    console.error('sendAlert error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send alert email.',
      error: error.message
    });
  }
};




export const getAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortField = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Parse pagination
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const offset = (pageNumber - 1) * limitNumber;

    // Base query
    let baseQuery = `
      FROM tbl_vehicle_requests
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // Search condition
    if (search) {
      const searchCondition = `
        AND (
          LOWER(vehicleType) LIKE ? OR
          LOWER(make) LIKE ? OR
          LOWER(model) LIKE ? OR
          LOWER(fuelType) LIKE ? OR
          LOWER(transmissionType) LIKE ?
        )
      `;
      const searchTerm = `%${search.toLowerCase()}%`;

      baseQuery += searchCondition;
      params.push(...Array(5).fill(searchTerm));
      countParams.push(...Array(5).fill(searchTerm));
    }

    // Sorting
    const validSortFields = [
      'createdAt', 'vehicleType', 'make', 'model', 'minPrice', 'maxPrice'
    ];
    const safeSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Final queries
    const dataQuery = `
      SELECT * ${baseQuery}
      ORDER BY ${safeSortField} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    params.push(limitNumber, offset);

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;

    // Debug logs (optional)
    console.log('SQL Query:', dataQuery);
    console.log('Params:', params);

    // Execute
    const [alerts] = await pool.query(dataQuery, params);
    const [[totalCount]] = await pool.query(countQuery, countParams.length > 0 ? countParams : []);

    res.status(200).json(alerts);

  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

