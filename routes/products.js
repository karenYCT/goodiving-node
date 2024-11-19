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

// 詳細頁推薦商品
router.get("/recommend/:product_id", async (req, res) => {
  const { product_id } = req.params;

  try {
    // 1. 查找該 product_id 的所有 variant
    const [variants] = await db.query(
      "SELECT product_variant_id FROM product_variants WHERE product_id = ?",
      [product_id]
    );

    if (variants.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variantIds = variants.map((v) => v.product_variant_id);

    // 2. 查詢所有包含這些 variant 的 order_id
    const [orderItems] = await db.query(
      "SELECT order_id FROM order_items WHERE product_variant_id IN (?)",
      [variantIds]
    );

    if (orderItems.length === 0) {
      return res.status(404).json({ error: "No related orders found" });
    }

    const orderIds = orderItems.map((item) => item.order_id);

    // 3. 查詢同一訂單中的其他商品，計算相似度
    const [relatedItems] = await db.query(
      `SELECT product_variant_id FROM order_items 
       WHERE order_id IN (?) AND product_variant_id NOT IN (?)`,
      [orderIds, variantIds]
    );

    if (relatedItems.length === 0) {
      return res.status(404).json({ error: "No related products found" });
    }

    const relatedVariantIds = relatedItems.map(
      (item) => item.product_variant_id
    );

    // 4. 統計出現次數（作為簡單相似度評估）
    const productFrequency = {};
    relatedVariantIds.forEach((variant_id) => {
      if (!productFrequency[variant_id]) {
        productFrequency[variant_id] = 0;
      }
      productFrequency[variant_id] += 1;
    });

    // 5. 取出前4個最相關的 product_variant_id
    const sortedVariantIds = Object.keys(productFrequency)
      .sort((a, b) => productFrequency[b] - productFrequency[a])
      .slice(0, 4);

    if (sortedVariantIds.length === 0) {
      return res.status(404).json({ error: "No similar products found" });
    }

    // 6. 查詢推薦商品的詳細資訊並添加出現次數
    const [recommendedProducts] = await db.query(
      `SELECT pl.product_id id, pl.title, pl.price, pl.img_url image, pv.product_variant_id 
       FROM product_variants pv
       JOIN product_list pl ON pv.product_id = pl.product_id
       WHERE pv.product_variant_id IN (?)`,
      [sortedVariantIds]
    );

    // 7. 在推薦結果中添加出現次數並排序
    const resultWithFrequency = recommendedProducts
      .map((product) => ({
        ...product,
        occurrence: productFrequency[product.product_variant_id] || 0,
      }))
      .sort((a, b) => b.occurrence - a.occurrence); // 根據 occurrence 降序排序

    // 8. 返回推薦結果
    return res.json(resultWithFrequency);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
