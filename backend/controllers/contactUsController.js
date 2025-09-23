import pool from "../config/db.js";
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";



export const getContactUs = async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT * FROM tbl_contact_form where status = 'Y' `
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getContactUs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateContactUs = async (req, res) => {
  try {
    const id = req.params.id;
    const { subject, email, contactNumber, description, status } = req.body;
    if (!subject || !email || !contactNumber || !description || !status) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await pool.query(
      `UPDATE tbl_contact_form SET subject = ?, email = ?, contactNumber = ?, description = ?, status = ? WHERE id = ?`,
      [subject, email, contactNumber, description, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const [contact] = await pool.query(
      `SELECT * FROM tbl_contact_form WHERE id = ?`,
      [id]
    );
    res.status(200).json(...contact[0]);
  } catch (error) {
    console.error("Error in updateContactUs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteContactUs = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.query(
      `update tbl_contact_form set status = 'N' WHERE id = ?`,
      [id]
    );

    const [contact] = await pool.query(
      `SELECT * FROM tbl_contact_form WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res
      .status(200)
      .json({ message: "Contact deleted successfully", ...contact[0] });
  } catch (error) {
    console.error("Error in deleteContactUs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




export const getSuggestions = async (req, res) => {
  try {
    const [result] = await pool.query(`SELECT * FROM tbl_suggestions`);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in become partner api:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPartner = async (req, res) => {
  try {
    const [result] = await pool.query(`SELECT * FROM tbl_become_partner`);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in become partner api:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};







 
export const contactFrom = async (req, res) => {
  try {
    const { subject, email, contactNumber, description } = req.body;
    if (!subject || !email || !contactNumber || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }
 
    const [result] = await pool.query(
      `INSERT INTO tbl_contact_form (subject, email, contactNumber, description) VALUES (?, ?, ?, ?)`,
      [subject, email, contactNumber, description]
    );
 
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
    const emailHtml = (description) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Message</title>
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
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
      }
      .email-header {
          background-color: #0066cc;
          color: #ffffff;
          text-align: center;
          padding: 20px;
      }
      .email-header h1 {
          margin: 0;
          font-size: 22px;
      }
      .email-body {
          padding: 25px;
          font-size: 15px;
          line-height: 1.6;
      }
      .email-body p {
          margin: 0 0 15px;
      }
      .footer {
          background-color: #f1f1f1;
          text-align: center;
          font-size: 12px;
          color: #777777;
          padding: 15px;
      }
  </style>
</head>
<body>
  <div class="email-container">
      <div class="email-header">
          <h1>Wheelbidz Notification</h1>
      </div>
      <div class="email-body">
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Contact Number:</strong> ${contactNumber}</p>
          <p><strong>Message:</strong></p>
          <p>${description}</p>
      </div>
      <div class="footer">
          <p>© ${new Date().getFullYear()} Wheelbidz. All rights reserved.</p>
      </div>
  </div>
</body>
</html>`;
 
    const msg = {
      to: process.env.MAIL_USER,
      from: {
        name: "WheelBidz Pvt Ltd.",
        email: process.env.MAIL_USER,
      },
      replyTo: email,
      subject,
      html: emailHtml(description),
    };
 
    await sgMail.send(msg);
 
    const id = result.insertId;
    const [contact] = await pool.query(
      `SELECT * FROM tbl_contact_form WHERE id = ?`,
      [id]
    );
 
    res.status(201).json({ ...contact[0] });
  } catch (error) {
    console.error("Error in contactFrom:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
 
 
export const becomePartnerForm = async (req, res) => {
  try {
    const { fullName, contactNumber, email, businessType, city, description } = req.body;
    if (!businessType || !email || !city || !description || !fullName || !contactNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }
 
    const [result] = await pool.query(
      `INSERT INTO tbl_become_partner (name, contact, email, bussinessType, city, message) VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, contactNumber, email, businessType, city, description]
    );
 
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
    const emailHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Message</title>
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
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .email-header {
      background-color: #0066cc;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .email-body {
      padding: 25px;
      font-size: 15px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f1f1f1;
      text-align: center;
      font-size: 12px;
      color: #777777;
      padding: 15px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Wheelbidz - New Partner Request</h1>
    </div>
    <div class="email-body">
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Contact Number:</strong> ${contactNumber}</p>
      <p><strong>Business Type:</strong> ${businessType}</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Message:</strong></p>
      <p>${description}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Wheelbidz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
 
    const msg = {
      to: process.env.MAIL_USER,
      from: {
        name: "WheelBidz Pvt Ltd.",
        email: process.env.MAIL_USER,
      },
      replyTo: email,
      subject: "New Become Partner Request",
      html: emailHtml(),
    };
 
    await sgMail.send(msg);
 
    const id = result.insertId;
    const [partner] = await pool.query(
      `SELECT * FROM tbl_become_partner WHERE id = ?`,
      [id]
    );
 
    res.status(201).json({ ...partner[0] });
  } catch (error) {
    console.error("Error in becomePartnerForm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

 
export const giveSuggestion = async (req, res) => {
  try {
    const { name, email, contactNumber, suggestion } = req.body;
    if (!name || !email || !contactNumber || !suggestion) {
      return res.status(400).json({ message: "All fields are required" });
    }
 
    const [result] = await pool.query(
      `INSERT INTO tbl_suggestions (name, email, contactNumber, suggestion) VALUES (?, ?, ?, ?)`,
      [name, email, contactNumber, suggestion]
    );
 
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
    const emailHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Message</title>
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
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
      }
      .email-header {
          background-color: #0066cc;
          color: #ffffff;
          text-align: center;
          padding: 20px;
      }
      .email-header h1 {
          margin: 0;
          font-size: 22px;
      }
      .email-body {
          padding: 25px;
          font-size: 15px;
          line-height: 1.6;
      }
      .footer {
          background-color: #f1f1f1;
          text-align: center;
          font-size: 12px;
          color: #777777;
          padding: 15px;
      }
  </style>
</head>
<body>
  <div class="email-container">
      <div class="email-header">
          <h1>Wheelbidz Notification</h1>
      </div>
      <div class="email-body">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Contact Number:</strong> ${contactNumber}</p>
          <p><strong>Message:</strong></p>
          <p>${suggestion}</p>
      </div>
      <div class="footer">
          <p>© ${new Date().getFullYear()} Wheelbidz. All rights reserved.</p>
      </div>
  </div>
</body>
</html>`;
 
    const msg = {
      to: process.env.MAIL_USER,
      from: {
        name: "WheelBidz Pvt Ltd.",
        email: process.env.MAIL_USER,
      },
      replyTo: email,
      subject: "A Customer Suggestion has come!",
      html: emailHtml(),
    };
 
    await sgMail.send(msg);
 
    const id = result.insertId;
    const [suggestionRow] = await pool.query(
      `SELECT * FROM tbl_suggestions WHERE id = ?`,
      [id]
    );
 
    res.status(201).json({ ...suggestionRow[0] });
  } catch (error) {
    console.error("Error in giveSuggestion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
 
 