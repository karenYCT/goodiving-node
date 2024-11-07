import express from "express";
import db from "../utils/connect-sql.js";
const router = express.Router();

// 取得所有產品資料
router.get("/", async (req, res) => {
  const { cate, sort, minPrice, maxPrice, keyword } = req.query;
  let sql = `SELECT p.product_id id, p.title, c.product_category_name category, p.description, p.price, p.img_url image FROM product_list p JOIN product_categories c ON p.product_category_id = c.product_category_id WHERE 1=1`;

  const params = [];

  if (cate) {
    sql += " AND p.product_category_id = ?";
    params.push(cate);
  }

  if (minPrice) {
    sql += " AND p.price >= ?";
    params.push(minPrice);
  }

  if (maxPrice) {
    sql += " AND p.price <= ?";
    params.push(maxPrice);
  }

  if (keyword) {
    sql += " AND p.title LIKE ?";
    params.push(`%${keyword}%`);
  }

  if (sort) {
    if (sort === "price_asc") {
      sql += " ORDER BY p.price ASC";
    } else if (sort === "price_desc") {
      sql += " ORDER BY p.price DESC";
    } else if (sort === "time_asc") {
      sql += " ORDER BY p.created_time ASC"; // 假設有 created_at 欄位
    }
  }

  try {
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 取得單一產品資料
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 查詢產品基本資料
    const sql =
      "SELECT  title, description, price FROM product_list WHERE product_id = ?";
    const [productRows] = await db.execute(sql, [id]);
    const product = productRows[0];

    // 查詢產品變體資料
    const sql1 =
      "SELECT product_variant_id id ,size, color, stock FROM product_variants WHERE product_id = ?";
    const [variants] = await db.execute(sql1, [id]);

    // 查詢產品照片
    const sql2 = "SELECT img_url FROM product_images WHERE product_id = ?";
    const [images] = await db.execute(sql2, [id]);

    res.json({ ...product, variants, images });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
