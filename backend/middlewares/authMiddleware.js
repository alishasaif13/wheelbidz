import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


export const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        res.status(401).json({ status: 401, message: "Access Denied. No Token Provided." });
        return;
    }

    try {
        const decoded = jwt.verify(token, "your_secret_key");
        req.user = decoded; // Attach user data to request
        next(); // Proceed to next middleware/route
    } catch (error) {
        res.status(403).json({ status: 403, message: "Invalid Token" });
    }
};



export const isAdmin = (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase?.();
    console.log("User Role:", userRole); // Debugging line
    if (!userRole || userRole !== "admin") {
      return res.status(403).json({ 
        message: "Admin access required" 
      });
    }
    
    next();
};




export const isMember = (req, res, next) => {
    if (!req.user || req.user.role !== "member") {
        res.status(403).json({ status: 403, message: "Access Denied. Members Only." });
        return;
    }
    next(); 
};




export const isSeller = (req, res, next) => {
    if (!req.user || req.user.role !== "isBusinessMember") {
        res.status(403).json({ status: 403, message: "Access Denied. Seller  Only." });
        return;
    }
    next(); 
};