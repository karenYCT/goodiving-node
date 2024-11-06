import mysql from "mysql2/promise";

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  // port: DB_PORT, // 如果使用 3306 以外的通訊埠需要設定
  waitForConnections: true,
  connectionLimit: 5,
  /* 連線上限5，設定原因:每次連線+斷開DB很耗效能，因此用pool的方式連線，
     讓不用的連線可以暫時待在pool而不用重新斷開+連結 */
  queueLimit: 0, // sql語法的排隊佇列上限
});
export default db;
