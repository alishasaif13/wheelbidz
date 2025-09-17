import express from 'express';
import pool from '../config/db.js'


export const addHomePageData = async (req, res) => {
  try {
    const {
      heroTitle,
      heroSubTitle,
      afterHeroDesc,
      makingTitle,
      makingDesc,
      promiseDesc
    } = req.body;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // Text validation
    if (!heroTitle || !heroSubTitle || !afterHeroDesc || !makingTitle || !makingDesc || !promiseDesc) {
      return res.status(400).json({ message: "Please provide all fields!" });
    }

    // File validation + path cleanup
    const heroBgImage = req.files?.heroBgImage?.[0]?.path.replace(/\\/g, "/") || null;
    const makingImage = req.files?.makingImage?.[0]?.path.replace(/\\/g, "/") || null;
    const promiseImage = req.files?.promiseImage?.[0]?.path.replace(/\\/g, "/") || null;

    // Validate image existence
    if (!heroBgImage || !makingImage || !promiseImage) {
      return res.status(400).json({ message: "All images are required." });
    }

    const [query] = await pool.query(
      `INSERT INTO tbl_home (
        heroTitle, heroSubTitle, heroBgImage,
        afterHeroDesc, makingImage, makingTitle, makingDesc,
        promiseImage, promiseDesc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        heroTitle, heroSubTitle, heroBgImage,
        afterHeroDesc, makingImage, makingTitle, makingDesc,
        promiseImage, promiseDesc
      ]
    );

    const id = query.insertId;

    const [result] = await pool.query(
      `SELECT * FROM tbl_home WHERE status = 'Y' AND id = ?`,
      [id]
    );

    res.status(201).json({
      message: "Home page data added successfully",
      data: result[0]
    });

  } catch (error) {
    console.error('Error adding home page data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};




export const getHomePageData = async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM tbl_home WHERE status = 'Y'`);
  
      if (rows.length === 0) {
        res.status(404).send({ message: "Home page data not found!" });
        return;
      }
  
      const enriched = rows.map((item) => {
        const encodeImage = (imagePath) => {
          if (!imagePath) return null;
  
          const fullPath = path.join(process.cwd(), imagePath);
          if (!fs.existsSync(fullPath)) {
            console.warn(`Image not found at: ${fullPath}`);
            return null;
          }
  
          const buffer = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase().slice(1); // e.g., jpg
          return `data:image/${ext};base64,${buffer.toString("base64")}`;
        };
  
        return {
          ...item,
          heroBgImage: encodeImage(item.heroBgImage),
          makingImage: encodeImage(item.makingImage),
          promiseImage: encodeImage(item.promiseImage),
        };
      });
  
      res.status(200).send(enriched[0]); // assuming you're expecting a single home page config
    } catch (error) {
      console.error("Error getting home page data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
};





export const updateHomePageData = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            heroTitle,
            heroSubTitle,
            afterHeroDesc,
            makingTitle,
            makingDesc,
            promiseDesc
        } = req.body;

        if (!id) {
            res.status(400).json({ message: "ID is required for update." });
            return;
        }

        const existingDataQuery = await pool.query(`SELECT * FROM tbl_home WHERE id = ?`, [id]);
        const existingData = existingDataQuery[0][0];

        if (!existingData) {
            res.status(404).json({ message: "Record not found." });
            return;
        }

        // Use existing values if new ones aren't provided
        const heroBgImage = req.files?.heroBgImage?.[0]?.path.replace(/\\/g, "/") || existingData.heroBgImage;
        const makingImage = req.files?.makingImage?.[0]?.path.replace(/\\/g, "/") || existingData.makingImage;
        const promiseImage = req.files?.promiseImage?.[0]?.path.replace(/\\/g, "/") || existingData.promiseImage;

        const [updateResult] = await pool.query(
            `UPDATE tbl_home SET 
                heroTitle = ?, 
                heroSubTitle = ?, 
                heroBgImage = ?, 
                afterHeroDesc = ?, 
                makingImage = ?, 
                makingTitle = ?, 
                makingDesc = ?, 
                promiseImage = ?, 
                promiseDesc = ? 
             WHERE id = ?`,
            [
                heroTitle || existingData.heroTitle,
                heroSubTitle || existingData.heroSubTitle,
                heroBgImage,
                afterHeroDesc || existingData.afterHeroDesc,
                makingImage,
                makingTitle || existingData.makingTitle,
                makingDesc || existingData.makingDesc,
                promiseImage,
                promiseDesc || existingData.promiseDesc,
                id
            ]
        );

        const [updated] = await pool.query(`SELECT * FROM tbl_home WHERE id = ?`, [id]);
        res.json({ ...updated[0] });

    } catch (error) {
        console.error("Error updating home page data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};





export const deleteHomePage = async (req, res) =>{
    try {
        const id = req.params.id;

        const [query] = await pool.query(`update tbl_home set status = 'N' where id = ?`, [id]);

        res.status(200).send({message: "Deleted the home page successfully!"})
    } catch (error) {
        console.error("Error deleting home page:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}





export const addAboutPageData = async (req, res) => {
  try {
    const {
      heading1, subheading1,
      heading2, subheading2,
      heading3, subheading3,
      heading4, subheading4,
      heading5, subheading5
    } = req.body;

    // Required fields validation
    const requiredFields = {
      heading1, subheading1,
      heading2, subheading2,
      heading3, subheading3,
      heading4, subheading4,
      heading5, subheading5,
      image1: req.files?.image1?.[0]?.path,
      image2: req.files?.image2?.[0]?.path,
      image3: req.files?.image3?.[0]?.path,
      image4: req.files?.image4?.[0]?.path,
      image5: req.files?.image5?.[0]?.path
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Normalized paths
    const image1 = req.files.image1[0].path.replace(/\\/g, "/");
    const image2 = req.files.image2[0].path.replace(/\\/g, "/");
    const image3 = req.files.image3[0].path.replace(/\\/g, "/");
    const image4 = req.files.image4[0].path.replace(/\\/g, "/");
    const image5 = req.files.image5[0].path.replace(/\\/g, "/");

    // DB Insert
    const [insertResult] = await pool.query(
      `INSERT INTO tbl_about (
        heading1, subheading1, image1,
        heading2, subheading2, image2,
        heading3, subheading3, image3,
        heading4, subheading4, image4,
        heading5, subheading5, image5
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        heading1, subheading1, image1,
        heading2, subheading2, image2,
        heading3, subheading3, image3,
        heading4, subheading4, image4,
        heading5, subheading5, image5
      ]
    );

    const [result] = await pool.query(
      `SELECT * FROM tbl_about WHERE id = ?`, [insertResult.insertId]
    );

    res.status(201).json(result);

  } catch (error) {
    console.error("Error adding about page data:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};






export const getAboutPageData = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_about');

    const base64WithMeta = async (imgPath) => {
      if (!imgPath) return null;
      try {
        const absolutePath = path.resolve(imgPath);
        const fileBuffer = await fs.promises.readFile(absolutePath);
        const mimeType = path.extname(imgPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      } catch (error) {
        console.error(`Failed to read image ${imgPath}:`, error);
        return null;
      }
    };

    const processedRows = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        image1Base64: await base64WithMeta(row.image1),
        image2Base64: await base64WithMeta(row.image2),
        image3Base64: await base64WithMeta(row.image3),
        image4Base64: await base64WithMeta(row.image4),
        image5Base64: await base64WithMeta(row.image5),
      }))
    );

    res.status(200).json(processedRows);
  } catch (error) {
    console.error('Error fetching about page data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};






export const updateAboutPageData = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Missing 'id' for update" });
    }

    const fieldsToUpdate = {};
    const allowedFields = [
      'heading1', 'subheading1',
      'heading2', 'subheading2',
      'heading3', 'subheading3',
      'heading4', 'subheading4',
      'heading5', 'subheading5'
    ];

    // Add text fields if present
    for (const field of allowedFields) {
      if (req.body[field]) {
        fieldsToUpdate[field] = req.body[field];
      }
    }

    // Add images if present
    for (let i = 1; i <= 5; i++) {
      const imgField = `image${i}`;
      const filePath = req.files?.[imgField]?.[0]?.path;
      if (filePath) {
        fieldsToUpdate[imgField] = filePath.replace(/\\/g, "/");
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    // Construct SET clause
    const setClause = Object.keys(fieldsToUpdate)
      .map(field => `${field} = ?`)
      .join(', ');
    const values = Object.values(fieldsToUpdate);

    // Perform the update
    await pool.query(
      `UPDATE tbl_about SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    // Return updated row
    const [updatedRow] = await pool.query(`SELECT * FROM tbl_about WHERE id = ?`, [id]);

    res.status(200).json(updatedRow);

  } catch (error) {
    console.error('Error updating about page data:', error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};





import fs from 'fs';
import path from 'path';

export const deleteAboutPageData = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Missing ID parameter" });
    }

    // First, fetch the row to get image paths
    const [rows] = await pool.query(`SELECT * FROM tbl_about WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const record = rows[0];

    // Optional: delete images from disk
    const imagePaths = [record.image1, record.image2, record.image3, record.image4, record.image5];
    imagePaths.forEach(imgPath => {
      if (imgPath) {
        const absPath = path.resolve(imgPath);
        fs.unlink(absPath, err => {
          if (err) console.warn(`Failed to delete image at ${absPath}:`, err.message);
        });
      }
    });

    // Delete the row
    await pool.query(`DELETE FROM tbl_about WHERE id = ?`, [id]);

    res.status(200).json({ message: `Record with id ${id} deleted successfully.` });

  } catch (error) {
    console.error('Error deleting about page data:', error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
