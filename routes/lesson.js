import express from "express";
import db from "../utils/connect-sql.js";
const router = express.Router();

// 取得資料
// router.get("/", async (req, res) => {
//   const [rows] =await db.query('SELECT * FROM lesson_round');
//   res.json(rows);
// })

router.get("/", async (req, res) => {
  res.locals.title = "goodiving - " + res.locals.title;
  res.locals.pageName = "搜尋課程";
  const perPage = 10; // 每頁最多有幾筆
  let page = parseInt(req.query.page) || 1;

  const t_sql = "SELECT COUNT(1) totalRows FROM lesson_round";
  const [[{ totalRows }]] = await db.query(t_sql); // 多層解構
  const totalPages = Math.ceil(totalRows / perPage); // 總頁數

  const sql = `SELECT * FROM lesson_round 
              ORDER BY round_start ASC LIMIT ${(page - 1) * perPage}, ${perPage}`;
  const [rows] = await db.query(sql);

  res.json({ totalRows, totalPages, rows });
});

export default router;