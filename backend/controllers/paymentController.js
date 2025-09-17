import express from 'express';
import pool from '../config/db.js';
import Stripe from 'stripe';



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



export const addTransactionData = async (req, res) => {
    try {
        const { userId, totalBalance, lockedBalance } = req.body;

        // Check if all required fields are provided
        if (!userId || totalBalance === undefined || lockedBalance === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const [query] = await pool.query(`insert into tbl_tracking_funds (userId, totalBalance, lockedBalance) values (?, ?, ?)`, [userId, totalBalance, lockedBalance]);

        const id = query.insertId;

        const [result] = await pool.query(`select * from tbl_tracking_funds where status = 'Y' and id = ?`, [id]);

        res.status(201).json({...result[0] });

    } catch (error) {
        console.error('Error adding transaction data:', error);
        res.status(500).json({ error: 'Internal server error' });
        
    }
}





export const getTransactionData = async (req, res) => {
    try {
        const [query] = await pool.query(`select * from tbl_tracking_funds where status = 'Y'`);

        if (!query.length) {
            return res.status(404).json({ error: 'No transaction data found' });
        }

        res.status(200).json(query);
    } catch (error) {
        console.error('Error fetching transaction data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}







export const updateTransactionData = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { userId, totalBalance, lockedBalance } = req.body;
        if (!userId || totalBalance === undefined || lockedBalance === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const [query] = await pool.query(`update tbl_tracking_funds set userId = ?, totalBalance = ?, lockedBalance = ? where id = ?`, [userId, totalBalance, lockedBalance, id]);

        const [result] = await pool.query(`select * from tbl_tracking_funds where status = 'Y' and id = ?`, [id]);

        res.status(200).json({...result[0] });
    } catch (error) {
        console.error('Error updating transaction data:', error);
        res.status(500).json({ error: 'Internal server error' });
        
    }
}





export const deleteTransactionData = async (req, res) => {
    try {
        const { id } = req.params;

        const [query] = await pool.query(`update tbl_tracking_funds set status = 'N' where id = ?`, [id]);

        if (query.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction data not found' });
        }

        const [result] = await pool.query(`select * from tbl_tracking_funds where status = 'N' and id = ?`, [id]);
        res.status(200).json({ message: 'Transaction data deleted successfully', ...result[0]});
    } catch (error) {
        console.error('Error deleting transaction data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}





export const createPaymentIntent = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { vehicleId, fundId, userId, paymentMethod, description, referenceNo } = req.body;
        
        // 1. Validate required fields
        if (!vehicleId || !userId) {
            throw new Error('Vehicle ID and User ID are required');
        }

        // 2. Fetch vehicle details
        const [vehicle] = await connection.query(
            'SELECT id, buyNowPrice FROM tbl_vehicles WHERE id = ?',
            [vehicleId]
        );
        
        if (!vehicle.length) {
            throw new Error('Vehicle not found');
        }

        const amount = vehicle[0].buyNowPrice;

        const [rows] = await pool.query(`SELECT * FROM tbl_invoice`);

        if (!rows || rows.length === 0) {
        console.error(" No invoices found!");
        return res.status(404).json({ message: "No invoices found" });
        }


        let invoiceId = rows[0].id;
        console.log(invoiceId); 

        const [latestQuotation] = await pool.query("SELECT invoiceNo FROM tbl_invoice");
        if (latestQuotation.length===0) {
            res.status(400).json({ message: "No invoice record found!" });
            return;
        }

        let QuotationNo = latestQuotation[0].invoiceNo;
        let nextInvoiceNo = QuotationNo; //  Corrected Invoice Increment
        nextInvoiceNo++
        console.log("incremented iD:", nextInvoiceNo);

        // 4. Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents/paisa
            currency: 'usd', // Stripe doesn't support PKR directly
            metadata: {
                userId,
                invoiceNo: `PAY-${QuotationNo}`,
                fundId,
                paymentMethod,
                amount,
                description,
                transactionDate: new Date().toISOString(),
                referenceNo,
                vehicleId
            }
        });

        // 5. Record transaction
        const [transaction] = await connection.query(
            `INSERT INTO tbl_funds_transaction 
            (fundId, userId, paymentMethod, amount, description, transactionDate, referenceNo, invoiceNo) 
            VALUES (?, ?, ?, ?, ?, CURRENT_DATE(), ?, ?)`,
            [fundId, userId, paymentMethod, amount, description, referenceNo, `PAY-${QuotationNo}`]
        );

        const [check] = await pool.query(
            `UPDATE tbl_invoice SET invoiceNo = ? WHERE id = ?`, 
            [nextInvoiceNo, invoiceId ]
        );
        console.log("newinvoice: " , nextInvoiceNo , "QuotationNo: " , invoiceId);

        await connection.commit();

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            invoiceNo: `PAY-${QuotationNo}`,
            amount,
            message: 'Payment intent created successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Payment error:', error);
        
        if (error.type === 'StripeInvalidRequestError') {
            res.status(400).json({ 
                success: false,
                error: 'Payment processing error',
                details: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: 'Failed to create payment intent',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    } finally {
        connection.release();
    }
};





export const fundDeposit = async (req, res) => {
    try {
        const { userId, amount, status, paymentMethod, referenceNo, description } = req.body;

        const [rows] = await pool.query(`SELECT * FROM tbl_invoice`);
        let invoiceno2 = rows[0]?.invoiceNo2;

        if (!invoiceno2 || invoiceno2.length === 0) {
            invoiceno2 = 1;
            await pool.query(`UPDATE tbl_invoice SET invoiceNo2=? WHERE id=?`, [invoiceno2, 1]);
        }

        if (!userId || !amount || !status || !paymentMethod || !referenceNo) {
            res.send({ message: "Please provide all fields" });
            return;
        }

        const nextInvoiceno2 = Number(invoiceno2) + 1;

        const [newFund] = await pool.query(
            `INSERT INTO tbl_fund_deposit (userId, amount, status, paymentMethod, referenceNo, invoiceNo, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, amount, status, paymentMethod, referenceNo, `FUN-${invoiceno2}`, description]
        );

        await pool.query(`UPDATE tbl_invoice SET invoiceNo2=? WHERE id=?`, [nextInvoiceno2, 1]);

        const inserted = newFund.insertId;
        const [result] = await pool.query(`SELECT * FROM tbl_fund_deposit WHERE id=?`, [inserted]);

        await pool.query(`insert into tbl_seller_account (userId, invoiceNo, paymentMethod, description, debit, balance) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, `DP-${invoiceno2}`, paymentMethod, description, amount, amount]
        );

        res.status(200).send({ ...result[0] });

    } catch (error) {
        console.error('Error adding Fund data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





export const updateFundDeposit = async (req, res) => {
    try {
        const { id } = req.params; // Get the fundDeposit id from URL params
        const { amount, status, paymentMethod, referenceNo } = req.body; // Get update fields from body

        if (!id) {
            res.status(400).send({ message: "ID is required" });
            return;
        }

        if (!amount || !status || !paymentMethod || !referenceNo) {
            res.status(400).send({ message: "Please provide all fields to update" });
            return;
        }

        const [updateResult] = await pool.query(
            `UPDATE tbl_fund_deposit 
             SET amount = ?, status = ?, paymentMethod = ?, referenceNo = ? 
             WHERE id = ?`,
            [amount, status, paymentMethod, referenceNo, id]
        );

        if (updateResult.affectedRows === 0) {
            res.status(404).send({ message: "Fund deposit not found" });
            return;
        }

        const [updatedFund] = await pool.query(
            `SELECT * FROM tbl_fund_deposit WHERE id = ?`,
            [id]
        );

        res.status(200).send({ ...updatedFund[0] });

    } catch (error) {
        console.error('Error updating Fund data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};






export const getFundDeposit = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = '' } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let searchQuery = '';
        let searchParams = [];

        if (search) {
            searchQuery = `
                WHERE 
                    userId LIKE ? OR 
                    amount LIKE ? OR 
                    status LIKE ? OR 
                    paymentMethod LIKE ? OR 
                    referenceNo LIKE ? OR 
                    date LIKE ? OR 
                    invoiceNo LIKE ?
            `;
            const searchValue = `%${search}%`;
            searchParams = Array(7).fill(searchValue);
        }

        // Main query with pagination
        const [data] = await pool.query(
            `
            SELECT userId, amount, status, paymentMethod, referenceNo, date, invoiceNo
            FROM tbl_fund_deposit
            ${searchQuery}
            ORDER BY date DESC
            LIMIT ? OFFSET ?
            `,
            [...searchParams, limit, offset]
        );

        // Count total entries
        const [countResult] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM tbl_fund_deposit
            ${searchQuery}
            `,
            [...searchParams]
        );

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        res.status(200).json(data);

    } catch (error) {
        console.error('Error getting transaction data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





export const addFundWithdrawl = async (req, res) => {
     try {
        const { 
            userId,
            amount,
            paymentMethod,
            status,
            description
        } = req.body;

        const [rows] = await pool.query(`SELECT * FROM tbl_invoice`);
        let invoiceno3 = rows[0]?.withdrawInvoice;

        if (!invoiceno3 || invoiceno3.length === 0) {
            invoiceno3 = 1;
            await pool.query(`UPDATE tbl_invoice SET withdrawInvoice=? WHERE id=?`, [invoiceno3, 1]);
        }

        if (!userId || !amount || !status || !paymentMethod || !description || !invoiceno3) {
            res.send({ message: "Please provide all fields" });
            return;
        }

        const nextInvoiceno3 = Number(invoiceno3) + 1;
        
        // const inserted = newWith.insertId;
            
        const [result] = await pool.query(`select * from tbl_fund_deposit where userId = ? order by date desc limit 1`, [userId]);
        const insertId = result[0].id;
        const userAmount = result[0].amount;

        const balance = userAmount - amount;
        
            await pool.query(`update tbl_fund_deposit set amount=? where id=? `, [balance, insertId]);
            
            const [newWith] = await pool.query(
                `INSERT INTO tbl_fund_withdraw (userId, amount, paymentMethod, status, description, invoiceNo) VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, amount, paymentMethod, status, description, `WD-${invoiceno3}`]
            );

            await pool.query(`UPDATE tbl_invoice SET withdrawInvoice=? WHERE id=?`, [nextInvoiceno3, 1]);


        await pool.query(`insert into tbl_seller_account (userId, invoiceNo, paymentMethod, description, debit, credit, balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, `WD-${invoiceno3}` , paymentMethod, description, userAmount, amount, balance]        
        );

        res.status(200).send({ ...result[0] });

    } catch (error) {
        console.error('Error adding Fund data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}





export const updateFundWithdrawl = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, status, description } = req.body;

        // Validate required fields
        if (!id || !amount || !status) {
            return res.status(400).json({ message: "Please provide ID, amount, and status" });
        }

        // 1. Get the current withdrawal record first
        const [currentRecord] = await pool.query(
            `SELECT * FROM tbl_fund_withdraw WHERE id = ?`,
            [id]
        );

        if (!currentRecord || currentRecord.length === 0) {
            return res.status(404).json({ message: "Withdrawal record not found" });
        }

        const userId = currentRecord[0].userId;
        const originalAmount = currentRecord[0].amount;
        //250 amount  in orignal amount

        // 2. Update the withdrawal record
        await pool.query(
            `UPDATE tbl_fund_withdraw 
             SET amount = ?, status = ?, description = ?
             WHERE id = ?`,
            [amount, status, description || currentRecord[0].description, id]
        );

        // 3. Adjust the user's deposit balance
        // Get latest deposit record
        const [depositRecord] = await pool.query(
            `SELECT * FROM tbl_fund_deposit 
             WHERE userId = ? 
             ORDER BY date DESC LIMIT 1`,
            [userId]
        );

        if (depositRecord.length > 0) {
            const depositId = depositRecord[0].id;
            const currentBalance = depositRecord[0].amount;
            
            //current balance is 1000
            
            // Calculate new balance: reverse original, apply new amount
            
            const newBalance = (Number(currentBalance) + Number(originalAmount)) - Number(amount);
            console.log("current balance",currentBalance);
            console.log("originalAmount",originalAmount + "amount",amount);
            console.log("newBalance", newBalance);
            await pool.query(
                `UPDATE tbl_fund_deposit 
                 SET amount = ? 
                 WHERE id = ?`,
                [newBalance, depositId]
            );
        }

        // 4. Get and return the updated withdrawal record
        const [updatedRecord] = await pool.query(
            `SELECT * FROM tbl_fund_withdraw WHERE id = ?`,
            [id]
        );

        res.status(200).json({
            message: "Withdrawal updated successfully",
            data: updatedRecord[0]
        });

    } catch (error) {
        console.error('Error updating withdrawal:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};




export const getFundWithdrawl = async (req, res) => {
    try {
        // Extract query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        // Build dynamic WHERE clause
        let whereClause = '';
        const searchFields = ['userId', 'amount', 'status', 'description', 'invoiceNo', 'date'];

        if (search) {
            const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
            whereClause = `WHERE ${searchConditions}`;
        }

        // Create array of search terms for SQL parameters
        const searchParams = search ? Array(searchFields.length).fill(`%${search}%`) : [];

        // Main query with pagination
        const [getWithdraw] = await pool.query(
            `SELECT * FROM tbl_fund_withdraw ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`,
            [...searchParams, limit, offset]
        );

        // Get total count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM tbl_fund_withdraw ${whereClause}`,
            searchParams
        );

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Send response
        res.status(200).json(getWithdraw);
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
