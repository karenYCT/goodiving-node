import express from "express";
import db from "../utils/connect-sql.js";
import mysql from "mysql2/promise";
const router = express.Router();

// 讀取購物車所有商品
router.get("/:user_id", async (req, res) => {
  // todo 檢查用戶token
  const user_id = req.params.user_id;

  try {
    // 查詢用戶的購物車商品資料 (cart_list)
    const sql1 = `
      SELECT c.cart_id, c.quantity, c.product_variant_id
      FROM cart_list c
      WHERE c.user_id = ?
    `;
    const [cartItems] = await db.execute(sql1, [user_id]);

    if (cartItems.length === 0) {
      return res.status(404).json({ message: "購物車為空或用戶不存在" });
    }

    // 取出所有的 product_variant_id(陣列)
    const productVariantIds = cartItems.map((item) => item.product_variant_id);
    // 用商品變體id來查詢該商品的size/color/stock
    const sql2 = `
      SELECT pv.product_variant_id, pv.product_id, pv.size, pv.color, pv.stock
      FROM product_variants pv
      WHERE pv.product_variant_id IN (?${",?".repeat(
        productVariantIds.length - 1
      )});
    `;

    const [productVariants] = await db.execute(sql2, productVariantIds);

    // 取出所有商品的 product_id
    const productIds = productVariants.map((pv) => pv.product_id);

    // 用商品id來查詢該商品的id/title/price/img_url
    const sql3 = `
      SELECT p.product_id, p.title, p.price, p.img_url
      FROM product_list p
      WHERE p.product_id IN (?${",?".repeat(productIds.length - 1)});
    `;
    const [productList] = await db.execute(sql3, productIds);

    // 合併商品資料並返回結果
    const response = cartItems.map((cartItem) => {
      // 用商品變體id來查詢該商品的size/color/stock
      const variant = productVariants.find(
        (pv) => pv.product_variant_id === cartItem.product_variant_id
      );
      // 用商品id來查詢該商品的id/title/price/img_url
      const product = productList.find(
        (p) => p.product_id === variant.product_id
      );
      // 將前端要的資料組裝
      return {
        id: product.product_id,
        vid: variant.product_variant_id,
        title: product.title,
        price: product.price,
        quantity: cartItem.quantity,
        size: variant.size,
        color: variant.color,
        image: product.img_url,
      };
    });

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 新增產品到購物車
router.post("/add", async (req, res) => {
  const { variant_id, user_id } = req.body;

  // 檢查資料庫中是否已經有此會員和商品變體
  const query = `
    SELECT cart_id, quantity
    FROM cart_list
    WHERE user_id = ? AND product_variant_id = ?
  `;

  try {
    const [results] = await db.execute(query, [user_id, variant_id]);

    if (results.length === 0) {
      // 購物車中沒有此商品，新增一筆
      const insertQuery = `
        INSERT INTO cart_list (user_id, product_variant_id, quantity)
        VALUES (?, ?, 1)
      `;
      const [result] = await db.execute(insertQuery, [user_id, variant_id]);
      res.status(201).json({
        ok: true,
        message: "Item added to cart",
        cart_id: result.insertId,
      }); // 將新增的 cart_id 回傳
    } else {
      // 購物車中已經有此商品，更新數量
      const cart_id = results[0].cart_id;
      const newQuantity = results[0].quantity + 1;

      const updateQuery = `
        UPDATE cart_list
        SET quantity = ?
        WHERE cart_id = ?
      `;
      await db.execute(updateQuery, [newQuantity, cart_id]);
      res.status(200).json({
        ok: true,
        message: "Item quantity updated",
        cart_id,
        newQuantity,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Database error" });
  }
});

export default router;
