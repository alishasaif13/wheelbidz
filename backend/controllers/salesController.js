import express from "express"; 
import pool from "../config/db.js";
import   { resolve }  from 'path';
import fs from 'fs';
import path from 'path';





export const addSalesInfo = async (req, res) => {
    try {
        const {
            userId,
            vehicleId,
            saleTime,
            saleName,
            region,
            saleType,
            saleHilight,
            currentSale,
            date,
            } = req.body;

        // Validate required fields
        const requiredFields = [
            'userId', 'vehicleId', 'saleTime', 'saleName', 
            'region', 'saleType', 'saleHilight', 'currentSale',
            'date'
        ];


        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Check if vehicle exists
        const [vehicle] = await pool.query(
            'SELECT * FROM tbl_vehicles WHERE id = ?', 
            [vehicleId]

        );

        if (vehicle.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        const [existingSale] = await pool.query(`select * from tbl_sales where vehicleId = ?`, [vehicleId]);
        if (existingSale.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Sales data for this vehicle already exists'
            });
        }

        // Insert into database
        const [result] = await pool.query(
            `INSERT INTO tbl_sales (
                userId, vehicleId, saleTime, saleName, region, 
                saleType, saleHilight, currentSale, date
                
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, vehicleId, saleTime, saleName, region,
                saleType, saleHilight, currentSale, date
            ]
        );

        const [inserted] = await pool.query(`select * from tbl_sales where vehicleId = ?`, [vehicleId]);

        res.status(201).json({...inserted[0]});
    } catch (error) {
        console.error(" Error adding Sales data:", error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}



export const getSalesInfo = async (req, res) => {
    try {
        // Get query parameters
        const { 
            page = 1, 
            limit = 10, 
            saleType, 
            search 
        } = req.query;

        // Calculate pagination
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const finalLimit = Math.max(1, parseInt(limit));

        // Base query
        let query = `SELECT * FROM tbl_sales WHERE saleStatus = 'Y'`;
        let countQuery = `SELECT COUNT(*) as total FROM tbl_sales WHERE saleStatus = 'Y'`;
        const params = [];
        const countParams = [];

        // Add saleType filter if provided
        if (saleType) {
            query += ` AND saleType = ?`;
            countQuery += ` AND saleType = ?`;
            params.push(saleType);
            countParams.push(saleType);
        }

        // Add search functionality if provided
        if (search) {
            query += ` AND (
                saleName LIKE ? OR 
                region LIKE ? OR 
                saleHilight LIKE ?
            )`;
            countQuery += ` AND (
                saleName LIKE ? OR 
                region LIKE ? OR 
                saleHilight LIKE ?
            )`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        // Add pagination to main query
        query += ` LIMIT ? OFFSET ?`;
        params.push(finalLimit, offset);

        // Execute queries
        const [sales] = await pool.query(query, params);
        const [totalSales] = await pool.query(countQuery, countParams);
        const total = totalSales[0].total;

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No sales data found matching your criteria'
            });
        }

        res.status(200).json(sales);

    } catch (error) {
        console.error(" Error fetching sales data:", error);
        res.status(500).json({ 
            status: 500, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
}





export const updateSalesInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const {
            userId,
            vehicleId,
            saleTime,
            saleName,
            region,
            saleType,
            saleHilight,
            currentSale,
            date,
            } = req.body;

        // Validate required fields
        const requiredFields = [
            'userId', 'vehicleId', 'saleTime', 'saleName', 
            'region', 'saleType', 'saleHilight', 'currentSale',
            'date'
        ];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Check if sales info exists
        const [salesInfo] = await pool.query(
            'SELECT * FROM tbl_sales WHERE id = ?', 
            [id]
        );

        if (salesInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales info not found'
            });
        }
        // Update sales info in database
        const [result] = await pool.query(
            `UPDATE tbl_sales SET ? WHERE id = ?`,
            [req.body, id]
        );

        const [updated] = await pool.query(`SELECT * FROM tbl_sales WHERE id = ?`, [id]);

        res.status(200).json({...updated[0]});
    } catch (error) {
        console.error(" Error updating Sales data:", error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}





export const deleteSalesInfo = async (req, res) => {
    try {
        const id = req.params.id;
        // Check if sales info exists
        const [salesInfo] = await pool.query(
            'SELECT * FROM tbl_sales WHERE id = ?', 
            [id]
        );

        if (salesInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sales info not found'
            });
        }

        // Delete the sales info
        const [deleted] = await pool.query(
            `UPDATE tbl_sales SET saleStatus = 'N' WHERE id = ?`, 
            [id]
        );

        const [result] = await pool.query(`SELECT * FROM tbl_sales WHERE id = ?`, [id]);

        res.status(200).json({
            ...result[0]
        });
    } catch (error) {
        console.error(" Error deleting Sales data:", error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}
