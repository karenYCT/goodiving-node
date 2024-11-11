import express from "express";
import db from "../utils/connect-sql.js";
import mysql from "mysql2/promise";
const router = express.Router();

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

// 更新購物車商品數量
router.put("/updateQuantity", async (req, res) => {
  const { vid, quantity } = req.body;

  if (!vid || !Number.isInteger(quantity) || quantity < 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    // 更新購物車數量的 SQL 查詢
    const sql =
      "UPDATE cart_list SET quantity = ? WHERE product_variant_id = ?";
    const [result] = await db.execute(sql, [quantity, vid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 刪除購物車商品
router.delete("/delete", async (req, res) => {
  const { vid } = req.body;

  if (!vid) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    // 刪除購物車商品的 SQL 查詢
    const sql = "DELETE FROM cart_list WHERE product_variant_id = ?";
    const [result] = await db.execute(sql, [vid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 新增訂單
router.post("/checkout", async (req, res) => {
  const { user_id, selectedProducts } = req.body;

  if (!user_id || !selectedProducts || selectedProducts.length === 0) {
    return res.status(400).json({ message: "無效的訂單資料" });
  }

  const [order] = await db.execute(
    `SELECT order_id FROM order_list WHERE user_id = ? AND is_paid = false`,
    [user_id]
  );

  if (order.length > 0) {
    return res.status(400).json({ order_exist: true });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const insufficientStockProducts = []; // 用來存儲庫存不足的商品

    // 檢查每個選中商品的庫存
    for (const product of selectedProducts) {
      const { vid, quantity } = product;

      const [rows] = await connection.execute(
        "SELECT stock FROM product_variants WHERE product_variant_id = ? FOR UPDATE",
        [vid]
      );

      if (rows.length === 0) {
        throw new Error(`找不到商品變體ID: ${vid}`);
      }

      const stock = rows[0].stock;

      if (stock < quantity) {
        // 庫存不足，記錄該商品和其剩餘庫存
        insufficientStockProducts.push({
          vid,
          title: product.title,
          availableStock: stock,
        });
      }
    }

    // 如果有庫存不足的商品，回傳信息給前端
    if (insufficientStockProducts.length > 0) {
      return res.status(400).json({
        message: "部分商品庫存不足",
        insufficientStockProducts,
      });
    }

    // 庫存充足，繼續處理訂單，插入到 order_list 表格
    const [orderResult] = await connection.execute(
      "INSERT INTO order_list (user_id) VALUES (?)",
      [user_id] // 其他皆為空值，在結帳畫面更新資料
    );

    const orderId = orderResult.insertId;

    // 插入到 order_items 表格
    for (const product of selectedProducts) {
      const { vid, quantity, price } = product;

      await connection.execute(
        "INSERT INTO order_items (order_id, product_variant_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, vid, quantity, price]
      );
    }

    // 從 cart_list 中移除已購買的商品
    const productVariantIds = selectedProducts.map((product) => product.vid);

    await connection.execute(
      `DELETE FROM cart_list WHERE user_id = ? AND product_variant_id IN (?${",?".repeat(
        productVariantIds.length - 1
      )});`,
      [user_id, ...productVariantIds]
    );

    // 提交 transaction
    await connection.commit();
    res
      .status(200)
      .json({ message: "訂單已生成，商品已從購物車移除", orderId });
  } catch (error) {
    await connection.rollback();
    console.error("結帳失敗:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// 讀取訂單(用JWT middleware驗證)
router.get("/checkout", async (req, res) => {
  const user_id = req.headers["x-user-id"];
  const connection = await db.getConnection();
  try {
    // 查詢未支付的訂單
    const [orderList] = await connection.execute(
      `SELECT order_id FROM order_list WHERE user_id = ? AND is_paid = false`,
      [user_id]
    );

    if (orderList.length === 0) {
      return res.status(404).json({ message: "沒有找到未支付的訂單" });
    }

    const orderId = orderList[0].order_id; // 假設每個用戶只有一個未支付的訂單

    // 查詢訂單中的商品資訊
    const [items] = await connection.execute(
      `SELECT
        p.img_url image,
        p.title,
        p.price,
        oi.order_id,
        oi.quantity,
        v.size,
        v.color
      FROM order_items oi
      JOIN product_variants v ON oi.product_variant_id = v.product_variant_id
      JOIN product_list p ON v.product_id = p.product_id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    // 返回商品資訊
    res.status(200).json(items);
  } catch (error) {
    console.error("查詢未支付訂單失敗:", error);
    res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  } finally {
    connection.release();
  }
});

// 更新訂單
router.patch("/checkout", async (req, res) => {
  const {
    orderId,
    shipping_method,
    shipping_address,
    payment_method,
    recipient_name,
    recipient_email,
    recipient_phone,
  } = req.body;

  // 驗證必填欄位
  if (
    !shipping_method ||
    !shipping_address ||
    !payment_method ||
    !recipient_name ||
    !recipient_email ||
    !recipient_phone
  ) {
    return res.status(400).json({ message: "請填寫所有欄位" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 更新訂單資訊
    const [result] = await connection.execute(
      `UPDATE order_list 
       SET shipping_method = ?, shipping_address = ?, payment_method = ?, recipient_name = ?, recipient_email = ?, recipient_phone = ?
       WHERE order_id = ?`,
      [
        shipping_method,
        shipping_address,
        payment_method,
        recipient_name,
        recipient_email,
        recipient_phone,
        orderId,
      ]
    );

    // 檢查是否有任何行被更新
    if (result.affectedRows === 0) {
      throw new Error(`找不到訂單ID: ${orderId}`);
    }

    await connection.commit();
    res.status(200).json({ ok: true, message: "訂單資訊已更新" });
  } catch (error) {
    await connection.rollback();
    console.error("更新訂單失敗:", error);
    res.status(500).json({ ok: false, message: error.message });
  } finally {
    connection.release();
  }
});

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

channel_id = "2006556386";
channel_secret_key = "044354c7855611a40b85e9a430486c2e";

export default router;
