// lib/db.js
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created successfully');
} catch (error) {
  console.error('❌ Database pool creation failed:', error);
}

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('✅ Database connection successful');
    return { success: true, message: 'Database connected' };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return { 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    };
  }
}

export async function query(sql, params = []) {
  try {
    console.log(`📊 Executing query: ${sql}`);
    console.log(`📊 Original parameters:`, params);
    
    const cleanParams = params.map(param => {
      if (param === undefined) {
        console.warn('⚠️ Converting undefined parameter to null');
        return null;
      }
      return param;
    });
    
    console.log(`📊 Clean parameters:`, cleanParams);
    
    const [rows] = await pool.execute(sql, cleanParams);
    console.log(`✅ Query successful, returned ${rows.length} rows`);
    return rows;
  } catch (error) {
    console.error(`❌ Query failed: ${sql}`, error);
    console.error(`❌ Parameters that caused error:`, params);
    throw error;
  }
}

export default pool;