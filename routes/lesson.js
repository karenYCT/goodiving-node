import express from "express";
import db from "../utils/connect-sql.js";
const router = express.Router();

// 取得資料
const getListData = async (req) => {
  let output = {
      success: false,
  };
  const perPage = 10; // 設每頁最多有幾筆
  let page = parseInt(req.query.page) || 1; //轉成整數頁數 或是 false(NaN)
  let redirect = "";
  if(page<1){
      redirect = "?page=1";
      return {...output, redirect};
  };

  const t_sql = "SELECT COUNT(*) totalRows FROM lesson_round";
  const [[{totalRows}]] = await db.query(t_sql); // 多層解構
  const totalPages = Math.ceil(totalRows/perPage); // 無條件進位取總頁數
  let rows = []; // 把rows拉出來給預設值
  if(totalRows>0){
      // 有資料才能取得分頁資料
      if(page>totalPages){
          redirect = `?page=${totalPages}`;
          return {...output, redirect};
      };

      const sql = `SELECT * FROM lesson_round ORDER BY round_start ASC LIMIT ${(page-1) * perPage}, ${perPage}`;
      [rows] = await db.query(sql);
  
      // 日期格式轉換
      // rows.forEach((el) => {
      //     const m = moment(el.birthday);
      //     el.birthday = m.isValid() ? m.format("YYYY-MM-DD") : "";
      // });
  };
  return{
      success: true, redirect, totalRows, totalPages, perPage, page, rows
  };
};

router.get("/", async (req, res) => {
  const [rows] =await db.query('SELECT * FROM lesson_round');
  res.json(rows);
})

export default router;