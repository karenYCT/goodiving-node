import mysql from "mysql2/promise"

// const { DB_HOST, DB_USER, DB_PASS, DB_NAME} = process.env;
// console.log({DB_HOST, DB_USER, DB_PASS, DB_NAME});

const DB_HOST='192.168.66.153'
const DB_USER='look'
const DB_PASS='P@@520'
const DB_NAME='blog'
const DB_PORT=3306

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default db;