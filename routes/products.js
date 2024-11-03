import express from "express";
import db from "../utils/connect-sql.js";

const router = express.Router();

// 取得所有產品資料
router.get("/", async (req, res) => {
  const sql =
    "SELECT p.product_id id, p.title, c.product_category_name category, p.description, p.price, p.img_url image FROM product_list p JOIN product_categories c ON p.product_category_id = c.product_category_id;";

  const [rows] = await db.query(sql);
  res.json(rows);
});

export default router;
