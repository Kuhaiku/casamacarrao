// lib/db.ts
import mysql from 'mysql2/promise'

const globalForMysql = global as unknown as { mysqlPool: mysql.Pool }

export const pool =
  globalForMysql.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

if (process.env.NODE_ENV !== 'production') globalForMysql.mysqlPool = pool