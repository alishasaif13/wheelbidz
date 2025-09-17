import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '+00:00',
  dateStrings: true,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(" Connected to MySQL database.");
    connection.release();
  } catch (err) {
    console.error(" Database connection failed:", err.message);
  }
}

testConnection(); 

export default pool;