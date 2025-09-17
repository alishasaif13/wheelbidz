import express from "express"; 
import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import   { resolve }  from 'path';
import path from 'path';
import * as fs from 'fs';
import * as fsAsync from 'fs/promises'; 
import { uploadPhoto, getPhotoUrl, deleteFileFromCloudinary } from '../utils/cloudinary.js'; 
import  passport  from  'passport';
import nodemailer from 'nodemailer';
import dotenv from "dotenv";



dotenv.config();

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Fetch user by email
        const [users] = await pool.query("SELECT * FROM tbl_users WHERE email = ?", [email]);

        //  2. Check if user exists
        if (users.length === 0) {
            return res.status(400).json({ 
                status: 400, 
                message: "Invalid email or password" 
            });
        }

        let user = users[0];

        
        // 2. Check if user exists
        if (users.length === 0) {
            return res.status(400).json({ 
                status: 400, 
                message: "Invalid email or password" 
            });
        }

         user = users[0];

         console.log(user);

        // 3. Check account status
        if (user.status === 'N') {
            return res.status(403).json({ 
                status: 403, 
                message: "Account deactivated. Contact support." 
            });
        }

        if (user.emailVerifStatus === 'Non-Active') {
            return res.status(403).json({ 
                status: 403, 
                message: "Please verfiy your account through email first!" 
            });
        }

        // 4. Password verification
        let storedPassword = user.password;
        const isHashed = storedPassword.startsWith("$2b$");

        // Auto-upgrade plain text passwords
        if (!isHashed) {
            console.log("Upgrading password security...");
            const hashedPassword = await bcrypt.hash(storedPassword, 10);
            await pool.query(
                "UPDATE tbl_users SET password = ? WHERE email = ?", 
                [hashedPassword, email]
            );
            storedPassword = hashedPassword;
        }

        // 5. Compare passwords
        const isMatch = await bcrypt.compare(password, storedPassword);
        if (!isMatch) {
            return res.status(400).json({ 
                status: 400, 
                message: "Invalid email or password" 
            });
        }

        // 6. Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email, 
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
                token: token,
                id: user.id,
                name: user.name,
                email: user.email,
                contact: user.contact,
                cnic: user.cnic,
                address: user.address,
                postcode: user.postcode,
                image: user.image,
                role: user.role,
                date: user.date,
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            status: 500, 
            message: "Internal server error" 
        });
    }
};



export const getUsersById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    console.log("Fetching user with ID:", id);

    const defaultLimit = 10;
    const defaultPage = 1;
    const entry = parseInt(req.query.entry) || defaultLimit;
    const page = parseInt(req.query.page) || defaultPage;
    const limit = Math.max(1, entry);
    const offset = (Math.max(1, page) - 1) * limit;

    // Fetch user from DB
    const [rows] = await pool.query(
      `SELECT id, name, contact, cnic, address, postcode,
       email, password, date, role, image
       FROM tbl_users
       WHERE status = 'Y' AND id = ?
       LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    if (!rows?.length) {
      return res.status(404).json({ message: "No user found with that ID" });
    }

    // Process Cloudinary image
    const user = rows[0];
    let cloudinaryImages = [];

    try {
      if (user.image) {
        const parsed = JSON.parse(user.image); 
        if (Array.isArray(parsed)) {
          cloudinaryImages = parsed.map(publicId =>
            getPhotoUrl(publicId, {
              width: 400,
              crop: "thumb",
              quality: "auto"
            })
          );
        }
      }
    } catch (err) {
      console.warn("Failed to parse image public_id JSON:", err.message);
    }

    const userWithImage = {
      ...user,
      image: cloudinaryImages.length > 0 ? cloudinaryImages[0] : null // assuming 1 image max
    };

    return res.status(200).json(userWithImage);

  } catch (error) {
    console.error("Failed to fetch user:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
};



export const registerBusinessMember = async (req, res) => {
  try {
    const {
      name, contact, cnic, address,
      postcode, email, password, role
    } = req.body;

    // if (!name || !email || !password || !role) {
    //   return res.status(400).json({ status: 400, message: "All fields are required" });
    // }
    const uploadedLocalFilePaths = [];
    let imagePublicId = null;

    // Upload profile image to Cloudinary
    if (req.file?.path) {
      uploadedLocalFilePaths.push(req.file.path);

      try {
        const { public_id } = await uploadPhoto(req.file.path, 'profile_pictures');
        imagePublicId = public_id;

        // Cleanup local file
        try {
          await fs.access(req.file.path);
          await fs.unlink(req.file.path);
        } catch (err) {
          console.warn(`Could not delete temp file ${req.file.path}:`, err.message);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError.message);
      }
    }

    const [existing] = await pool.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ status: 400, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await pool.query(
      `INSERT INTO tbl_users (
        name, contact, cnic, address,
        postcode, email, password, image,
        date, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?)`,
      [
        name,
        contact,
        cnic,
        address,
        postcode,
        email,
        hashedPassword,
        imagePublicId ? JSON.stringify([imagePublicId]) : null,
        role
      ]
    );

    const insertID = insertResult.insertId;

    await pool.query(`update tbl_users set emailVerifStatus = 'Active' where id = ?`,
      [insertID]
    );

    const newUserId = insertResult.insertId;
    const [newUser] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [newUserId]);

    // Attach full image URL to response (optional)
    const responseUser = { ...newUser[0] };
    responseUser.imageUrl = imagePublicId ? getPhotoUrl(imagePublicId, {
      width: 400, crop: 'thumb', quality: 'auto'
    }) : null;
    delete responseUser.image; // hide public_id if you want

    res.status(201).json(responseUser);

  } catch (error) {
    console.error("Error registering business member:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};




export const getuploadfile = async (req, res) => {
    res.sendFile(resolve('./controllers/uploadfile.html')); 
};





export const getRegisteredMembers = async (req, res) => {
    try {
        // Default values
        const defaultLimit = 10;
        const defaultPage = 1;
        
        // Get from query params
        const entry = parseInt(req.query.entry) || defaultLimit;
        const page = parseInt(req.query.page) || defaultPage;

        const limit = Math.max(1, entry);
        const offset = (Math.max(1, page) - 1) * limit;

        // Include image column in SELECT
        const [rows] = await pool.query(
          `SELECT id, name, contact, cnic, address, postcode, 
           email, password, date, role, image
           FROM tbl_users 
           WHERE status = 'Y' 
           LIMIT ? OFFSET ?`,
          [limit, offset]
        );

        if (!rows?.length) {
          return res.status(404).json({ message: "No members found" });
        }

        // Process images with proper path resolution
        const users = await Promise.all(rows.map(async (user) => {
            try {
                if (!user.image) return { ...user, image: null };
                
                const fullPath = path.join(process.cwd(), user.image);
                if (!fs.existsSync(fullPath)) {
                    console.warn(`Image not found at path: ${fullPath}`);
                    return { ...user, image: null };
                }

                const buffer = fs.readFileSync(fullPath);
                const ext = path.extname(fullPath).toLowerCase().slice(1);
                return {
                    ...user,
                    image: `data:image/${ext};base64,${buffer.toString('base64')}`
                };
            } catch (error) {
                console.error(`Image processing failed for user ${user.id}`, error);
                return { ...user, image: null };
            }
        }));
        
        // Return users with base64 images or null
        return res.status(200).json(users);

    } catch (error) {
        console.error("Failed to fetch members:", error);
        return res.status(500).json({ 
            success: false,
            error: "Server error",
            message: error.message 
        });
    }
};





export const updateBusinessMember = async (req, res) => {
    let uploadedLocalFilePath = null; // To store path for cleanup if upload fails

    try {
        const { id } = req.params;
        const { name, contact, cnic, address, postcode, email, password, role } = req.body;

        // Validate required fields
        if (!name || !contact || !cnic || !address || !postcode || !email || !role) {
            return res.status(400).json({ status: 400, message: "All fields are required" });
        }

        // Check if user exists and get current data, including old image public ID
        const [users] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }
        const user = users[0];

        // Hash password if provided
        let hashedPassword = user.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // --- Cloudinary Image Handling for Update ---
        let newImagePublicId = null; // Will store the public_id of the new image
        let oldImagePublicId = null; // Will store the public_id of the old image

        // Extract old public ID from the database field
        if (user.image) {
            try {
                // Assuming 'image' column stores JSON string of public IDs, but for a single profile pic, it's likely just one.
                // If it's stored as `JSON.stringify([public_id])`, parse it. If just `public_id`, use directly.
                const parsedImage = JSON.parse(user.image);
                if (Array.isArray(parsedImage) && parsedImage.length > 0) {
                    oldImagePublicId = parsedImage[0]; // Get the first (and likely only) public ID
                } else if (typeof user.image === 'string' && user.image.startsWith('profile_pictures/')) {
                    // Fallback for direct public_id strings if not JSON array
                    oldImagePublicId = user.image;
                }
            } catch (e) {
                console.warn(`Could not parse old image public_id for user ${id}:`, e.message);
                oldImagePublicId = user.image; // Fallback to raw value if JSON parsing fails
            }
        }


        // Handle new image upload if req.file exists
        if (req.file?.path) {
            uploadedLocalFilePath = req.file.path; // Store local path for cleanup

            try {
                // Upload the new image to Cloudinary
                const { public_id } = await uploadPhoto(req.file.path, 'profile_pictures');
                newImagePublicId = public_id;

                // Cleanup new local file immediately after successful Cloudinary upload
                try {
                    await fs.access(req.file.path);
                    await fs.unlink(req.file.path);
                    uploadedLocalFilePath = null; // Mark as cleaned up
                } catch (err) {
                    console.warn(`Could not delete new temp file ${req.file.path}:`, err.message);
                }

                // If a new image was uploaded and there was an old one, delete the old one from Cloudinary
                if (oldImagePublicId) {
                    try {
                        await deletePhoto(oldImagePublicId);
                    } catch (deleteError) {
                        console.warn(`Could not delete old Cloudinary image ${oldImagePublicId}:`, deleteError.message);
                    }
                }

            } catch (uploadError) {
                console.error("Cloudinary upload failed for new image:", uploadError.message);
                // If new upload fails, retain the old image's public ID
                newImagePublicId = oldImagePublicId;
            }
        } else {
            // If no new file is uploaded, retain the existing image's public ID
            newImagePublicId = oldImagePublicId;
        }
        // --- End Cloudinary Image Handling ---



        const imageToStoreInDB = newImagePublicId ? JSON.stringify([newImagePublicId]) : null;


        await pool.query(
            `UPDATE tbl_users
             SET name = ?, contact = ?, cnic = ?, address = ?,
                 postcode = ?, email = ?, password = ?, image = ?,
                 role = ?
             WHERE id = ?`,
            [name, contact, cnic, address, postcode, email, hashedPassword,
             imageToStoreInDB, role, id]
        );

        // Get updated user data
        const [updatedUsers] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
        const updatedUser = updatedUsers[0];

        // Attach full image URL to response (optional)
        const responseUser = { ...updatedUser };
        responseUser.imageUrl = newImagePublicId ? getPhotoUrl(newImagePublicId, {
            width: 400, crop: 'thumb', quality: 'auto'
        }) : null;
        delete responseUser.image; // Hide public_id if desired

        res.status(200).json(responseUser);

    } catch (error) {
        console.error("Error updating business member:", error);

        // Clean up any local temp file if a Cloudinary upload failed
        if (uploadedLocalFilePath) {
            try {
                await fs.access(uploadedLocalFilePath);
                await fs.unlink(uploadedLocalFilePath);
                console.log(`Cleaned up local temp file: ${uploadedLocalFilePath}`);
            } catch (cleanupError) {
                console.warn(`Failed to clean up local temp file ${uploadedLocalFilePath} in error handler:`, cleanupError.message);
            }
        }
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};




export const deleteBusinessMember = async (req, res) => {
    try {
        const { id } = req.params;
        const [user] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
        if (user.length === 0) {
            return res.status(404).json({ status: 404, message: "User not found" });
        }

        await pool.query("UPDATE tbl_users SET status = 'N' WHERE id = ?", [id]);
        res.status(200).json({ status: 200, message: "User Deleted successfully" });
    } catch (error) {
        console.error(" Error deactivating user:", error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};




export const registerByEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email already exists
    const [checkMail] = await pool.query(`SELECT * FROM tbl_users WHERE email = ?`, [email]);

    if (checkMail.length > 0) {
      return res.status(409).send({ 
        success: false, 
        message: "Email already exists. Please proceed to login!" 
      });
    }

    // Generate OTP
    const generated_OTP = Math.floor(1000 + Math.random() * 9000);
    console.log("Generated OTP:", generated_OTP); 

    // Insert new user with OTP
    const [insertUser] = await pool.query(
      `INSERT INTO tbl_users (email, otp, role, otp_status) VALUES (?, ?, 'customer', 'pending')`,
      [email, generated_OTP]
    );

    const insertedID = insertUser.insertId;

    // Check email credentials
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error('Email credentials not configured in environment variables');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false 
      }
    });

    // Verify SMTP connection
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP connection error:', error);
          reject(new Error('Failed to verify SMTP configuration'));
        } else {
          console.log('Server is ready to take our messages');
          resolve(success);
        }
      });
    });

    // Prepare email content with OTP
    const emailHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f7f7f7;
                  margin: 0;
                  padding: 0;
                  color: #333333;
              }
              .email-container {
                  max-width: 600px;
                  margin: 30px auto;
                  background-color: #ffffff;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              }
              .email-header {
                  background: linear-gradient(135deg, #0066cc, #004d99);
                  padding: 25px;
                  text-align: center;
              }
              .email-header h1 {
                  color: white;
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .email-body {
                  padding: 30px;
              }
              .otp-container {
                  background-color: #f0f7ff;
                  border-left: 4px solid #0066cc;
                  padding: 15px 20px;
                  margin: 25px 0;
                  border-radius: 4px;
              }
              .otp-code {
                  font-size: 32px;
                  font-weight: bold;
                  color: #0066cc;
                  letter-spacing: 5px;
                  text-align: center;
                  margin: 15px 0;
                  padding: 10px;
                  background: #e6f2ff;
                  border-radius: 6px;
              }
              .button {
                  display: block;
                  width: 200px;
                  margin: 30px auto;
                  padding: 12px 0;
                  background: linear-gradient(135deg, #0066cc, #004d99);
                  color: white;
                  text-align: center;
                  text-decoration: none;
                  border-radius: 5px;
                  font-weight: 600;
              }
              .footer {
                  text-align: center;
                  padding: 20px;
                  font-size: 12px;
                  color: #999999;
                  background-color: #f7f7f7;
              }
              .social-links {
                  text-align: center;
                  margin: 20px 0;
              }
              .social-links a {
                  margin: 0 10px;
                  text-decoration: none;
                  color: #0066cc;
                  font-weight: 500;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h1>Wheelbidz Verification</h1>
              </div>
              
              <div class="email-body">
                  <h2>Hello Valued User,</h2>
                  <p>Thank you for choosing Wheelbidz! To complete your verification process, please use the One-Time Password (OTP) below:</p>
                  
                  <div class="otp-container">
                      <p style="margin-top: 0; text-align: center;">Your verification code is:</p>
                      <div class="otp-code">${generated_OTP}</div>
                      <p style="margin-bottom: 0; text-align: center;">This code will expire in <strong>10 minutes</strong> for security reasons.</p>
                  </div>
                  
                  <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>
                  
                  <div class="social-links">
                      <p>Follow us on:</p>
                      <a href="#">Facebook</a> • 
                      <a href="#">Twitter</a> • 
                      <a href="#">Instagram</a>
                  </div>
              </div>
              
              <div class="footer">
                  <p>© 2023 Wheelbidz. All rights reserved.</p>
                  <p>1234 Auto Lane, Motor City, MC 56789</p>
                  <p>You are receiving this email because you signed up for a Wheelbidz account.</p>
                  <p><a href="#" style="color: #0066cc;">Unsubscribe</a> | <a href="#" style="color: #0066cc;">Privacy Policy</a></p>
              </div>
          </div>
      </body>
      </html>`;

    const mailOptions = {
      from: `"WheelBidz Pvt Ltd." <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Your Wheelbidz account verification OTP`,
      html: emailHtml
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    // Update OTP status to sent
    await pool.query(
      `UPDATE tbl_users SET otp_status = 'sent' WHERE email = ?`,
      [email]
    );

    // Return success response
    return res.status(200).send({
      success: true,
      message: "OTP sent successfully to your email",
      email: email
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error!",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Check if user exists with this email
    const [userRecords] = await pool.query(
      `SELECT * FROM tbl_users WHERE email = ?`, 
      [email]
    );
    
    if (userRecords.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Email not found. Please register first."
      });
    }
    
    const user = userRecords[0];
    
    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(401).send({
        success: false,
        message: "Invalid OTP. Please try again."
      });
    }
    
    // Check if OTP is expired (10 minutes)
    const otpCreatedAt = new Date(user.created_at || user.updated_at);
    const now = new Date();
    const diffInMinutes = (now - otpCreatedAt) / (1000 * 60);
    
    if (diffInMinutes > 10) {
      return res.status(401).send({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    // Update user status to verified
    await pool.query(
      `UPDATE tbl_users SET otp_status = 'sent' and emailVerifStatus = 'Active' WHERE email = ?`,
      [email]
    );
    
    // Return success response
    return res.status(200).send(
       {
        success: true,
        message: "OTP verified successfully",
        email: user.email,
        role: user.role,
        userId: user.id
      }
    );
    
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error!",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



export const registerEmailVerification = async (req, res) => {
  try {
    const {
      name, contact, cnic, address,
      postcode, email, password, role
    } = req.body;

    // if (!name || !email || !password || !role) {
    //   return res.status(400).json({ status: 400, message: "All fields are required" });
    // }
    const uploadedLocalFilePaths = [];
    let imagePublicId = null;

    // Upload profile image to Cloudinary
    if (req.file?.path) {
      uploadedLocalFilePaths.push(req.file.path);

      try {
        const { public_id } = await uploadPhoto(req.file.path, 'profile_pictures');
        imagePublicId = public_id;

        // Cleanup local file
        try {
          await fs.access(req.file.path);
          await fs.unlink(req.file.path);
        } catch (err) {
          console.warn(`Could not delete temp file ${req.file.path}:`, err.message);
        }
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError.message);
      }
    }

    const [existing] = await pool.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ status: 400, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await pool.query(
      `INSERT INTO tbl_users (
        name, contact, cnic, address,
        postcode, email, password, image,
        date, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?)`,
      [
        name,
        contact,
        cnic,
        address,
        postcode,
        email,
        hashedPassword,
        imagePublicId ? JSON.stringify([imagePublicId]) : null,
        role
      ]
    );

    const newUserId = insertResult.insertId;
    const [newUser] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [newUserId]);

    // Attach full image URL to response (optional)
    const responseUser = { ...newUser[0] };
    responseUser.imageUrl = imagePublicId ? getPhotoUrl(imagePublicId, {
      width: 400, crop: 'thumb', quality: 'auto'
    }) : null;
    delete responseUser.image;


    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error('Email credentials not configured in environment variables');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false 
      }
    });

     await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP connection error:', error);
          reject(new Error('Failed to verify SMTP configuration'));
        } else {
          console.log('Server is ready to take our messages');
          resolve(success);
        }
      });
    });

    const emailHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
              /* CSS from above template */
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f7f7f7;
                  margin: 0;
                  padding: 0;
                  color: #333333;
              }
              /* ... include all the CSS from above ... */
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h1>Wheelbidz Email Verification</h1>
              </div>
              
              <div class="email-body">
                  <h2>Hello Valued User,</h2>
                  <p>Thank you for choosing Wheelbidz! To complete your verification process, please click the button below to verify your email address:</p>
                  
                  <div class="verification-container">
                      <p class="verification-text">Click the button below to verify your email address and activate your Wheelbidz account:</p>
                      
                      <a href="http://192.168.1.5:5173/validation" class="button">Verify My Email Address</a>
                      
                      <p class="expiry-notice">This verification link will expire in <strong>24 hours</strong> for security reasons.</p>
                  </div>
                  
                  <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                  <p style="word-break: break-all; color: #0066cc; font-size: 14px;">${process.env.EMAIL_REDIRECT}</p>
                  
                  <p>If you didn't create a Wheelbidz account, please ignore this email or contact our support team if you have concerns.</p>
                  
                  <div class="social-links">
                      <p>Follow us on:</p>
                      <a href="https://facebook.com/wheelbidz">Facebook</a> • 
                      <a href="https://twitter.com/wheelbidz">Twitter</a> • 
                      <a href="https://instagram.com/wheelbidz">Instagram</a>
                  </div>
              </div>
              
              <div class="footer">
                  <p>© 2023 Wheelbidz. All rights reserved.</p>
                  <p>1234 Auto Lane, Motor City, MC 56789</p>
                  <p>You are receiving this email because you signed up for a Wheelbidz account.</p>
                  <p><a href="#" style="color: #0066cc;">Unsubscribe</a> | <a href="#" style="color: #0066cc;">Privacy Policy</a></p>
              </div>
          </div>
      </body>
      </html>`;

    const mailOptions = {
      from: `"WheelBidz Pvt Ltd." <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Your Wheelbidz Email Verification Link`,
      html: emailHtml
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  

    res.status(201).send({
      success: true,
      message: "Registration Success! Please check your mail to verfiy your email!",
      id: newUserId,
      email: email,
      role: role
    });

  } catch (error) {
    console.error("Error registering business member:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};



// export const registerEmailVerification = async (req, res) => {
//   try {
//     const {
//       name, contact, cnic, address,
//       postcode, email, password, role
//     } = req.body;

//     if (!name || !contact || !email || !password || !role) {
//       return res.status(400).json({ status: 400, message: "All fields are required" });
//     }

//     let imagePublicId = null;

//     // Upload profile image to Cloudinary
//     if (req.file?.path) {
//       try {
//         const { public_id } = await uploadPhoto(req.file.path, "profile_pictures");
//         imagePublicId = public_id;
//         await fs.unlink(req.file.path).catch(() => {}); // cleanup local file
//       } catch (uploadError) {
//         console.error("Cloudinary upload failed:", uploadError.message);
//       }
//     }

//     // Check existing email
//     const [existing] = await pool.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
//     if (existing.length > 0) {
//       return res.status(400).json({ status: 400, message: "Email already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Generate verification token
//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

//     // Insert user
//     const [insertResult] = await pool.query(
//       `INSERT INTO tbl_users (
//         name, contact, cnic, address,
//         postcode, email, password, image,
//         date, role, emailVerifStatus, verificationToken, tokenExpiry
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?, 'pending', ?, ?)`,
//       [
//         name,
//         contact,
//         cnic,
//         address,
//         postcode,
//         email,
//         hashedPassword,
//         imagePublicId ? JSON.stringify([imagePublicId]) : null,
//         role,
//         verificationToken,
//         tokenExpiry,
//       ]
//     );

//     const newUserId = insertResult.insertId;
//     const [newUser] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [newUserId]);

//     // Construct verification link
//     const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&id=${newUserId}`;

//     if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
//       throw new Error("Email credentials not configured in environment variables");
//     }

//     // Create transporter
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//       },
//     });

//     // Build email HTML
//     const emailHtml = `
//       <html>
//       <body>
//         <h2>Welcome to Wheelbidz </h2>
//         <p>Please verify your email by clicking the link below:</p>
//         <a href="${verificationLink}" 
//            style="padding:10px 20px; background:#0066cc; color:white; text-decoration:none; border-radius:5px;">
//            Verify Email
//         </a>
//         <p>This link will expire in 24 hours.</p>
//       </body>
//       </html>
//     `;

//     const mailOptions = {
//       from: `"WheelBidz Pvt Ltd." <${process.env.MAIL_USER}>`,
//       to: email,
//       subject: `Verify your Wheelbidz account`,
//       html: emailHtml,
//     };

//     await transporter.sendMail(mailOptions);

//     return res.status(201).json({
//       success: true,
//       message: "Registration successful! Please check your email to verify your account.",
//     });

//   } catch (error) {
//     console.error("Error registering business member:", error);
//     res.status(500).json({ status: 500, message: "Internal Server Error" });
//   }
// };



export const verifyEmail = async (req, res) => {
  try {
    const id  = req.params.id;

    const [user] = await pool.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
    if (!user.length) {
      return res.status(400).json({ success: false, message: "Invalid verification link" });
    }

    await pool.query("UPDATE tbl_users SET emailVerifStatus = 'Active' WHERE id = ?", [id]);

    return res.json({ success: true, message: "Email verified successfully!" });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};