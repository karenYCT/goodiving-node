import express from "express";
import db from "../utils/connect-sql.js";
import axios from "axios";
import { generateSignature } from "../utils/linepay.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const channelId = process.env.channel_id;
const channelSecret = process.env.channel_secret;
const linePayAPIUrl = process.env.linepay_api_url;
// 新增產品到購物車
router.post("/add", async (req, res) => {
  const { variant_id, user_id } = req.body;
  let sameItem = false;
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
        message: "Item added to cart",
        cart_id: result.insertId,
      }); // 將新增的 cart_id 回傳
    } else {
      // 購物車中已經有此商品，更新數量
      const cart_id = results[0].cart_id;
      const newQuantity = results[0].quantity + 1;
      sameItem = true;
      const updateQuery = `
        UPDATE cart_list
        SET quantity = ?
        WHERE cart_id = ?
      `;
      await db.execute(updateQuery, [newQuantity, cart_id]);
      res.status(200).json({
        message: "Item quantity updated",
        cart_id,
        newQuantity,
        sameItem,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Database error" });
  }
});

// 快捷新增產品到購物車
router.post("/quick_add", async (req, res) => {
  const { pid, user_id } = req.body;
  let sameItem = false;
  // 用pid抓出變體id的第一筆
  const sql = `SELECT product_variant_id FROM product_variants WHERE product_id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [pid]);
  const variant_id = rows[0].product_variant_id;

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
        message: "Item added to cart",
        cart_id: result.insertId,
      }); // 將新增的 cart_id 回傳
    } else {
      // 購物車中已經有此商品，更新數量
      const cart_id = results[0].cart_id;
      const newQuantity = results[0].quantity + 1;
      sameItem = true;
      const updateQuery = `
        UPDATE cart_list
        SET quantity = ?
        WHERE cart_id = ?
      `;
      await db.execute(updateQuery, [newQuantity, cart_id]);
      res.status(200).json({
        message: "Item quantity updated",
        cart_id,
        newQuantity,
        sameItem,
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
router.delete("/decrease", async (req, res) => {
  const { vid } = req.body;

  if (!vid) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    // 先檢查商品是否存在以及目前數量
    const checkSql =
      "SELECT quantity FROM cart_list WHERE product_variant_id = ?";
    const [items] = await db.execute(checkSql, [vid]);

    if (items.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const currentQuantity = items[0].quantity;

    if (currentQuantity === 1) {
      // 如果數量為 1，直接刪除該商品
      const deleteSql = "DELETE FROM cart_list WHERE product_variant_id = ?";
      await db.execute(deleteSql, [vid]);

      return res.status(200).json({
        message: "Cart item deleted successfully",
        removed: true, // 標記該商品已被完全移除
      });
    } else {
      // 數量大於 1，將數量減 1
      const updateSql =
        "UPDATE cart_list SET quantity = quantity - 1 WHERE product_variant_id = ?";
      const [result] = await db.execute(updateSql, [vid]);

      if (result.affectedRows === 0) {
        return res.status(500).json({ message: "Failed to update quantity" });
      }

      return res.status(200).json({
        message: "Quantity decreased successfully",
        removed: false, // 標記商品仍然存在
        newQuantity: currentQuantity - 1,
      });
    }
  } catch (error) {
    console.error("Error updating cart item:", error);
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

// 取消訂單返回購物車
router.post("/checkout/rollback", async (req, res) => {
  const { userId, orderId } = req.body;

  try {
    // 1. 查詢訂單中的商品
    const [orderItems] = await db.execute(
      "SELECT product_variant_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );

    // 2. 處理將商品加回購物車的邏輯
    for (let item of orderItems) {
      const [existingCartItem] = await db.execute(
        "SELECT quantity FROM cart_list WHERE user_id = ? AND product_variant_id = ?",
        [userId, item.product_variant_id]
      );

      if (existingCartItem.length > 0) {
        // 3. 若購物車中已有相同的商品，則合併數量
        const newQuantity = existingCartItem[0].quantity + item.quantity;
        await db.execute(
          "UPDATE cart_list SET quantity = ? WHERE user_id = ? AND product_variant_id = ?",
          [newQuantity, userId, item.product_variant_id]
        );
      } else {
        // 4. 若購物車中沒有該商品，則插入新的商品記錄
        await db.execute(
          "INSERT INTO cart_list (user_id, product_variant_id, quantity) VALUES (?, ?, ?)",
          [userId, item.product_variant_id, item.quantity]
        );
      }
    }

    // 5. 刪除訂單及其訂單項目
    await db.execute("DELETE FROM order_items WHERE order_id = ?", [orderId]);
    await db.execute("DELETE FROM order_list WHERE order_id = ?", [orderId]);

    res.status(200).json({ message: "訂單已取消，商品已返回購物車" });
  } catch (error) {
    console.error("返回修改過程中發生錯誤:", error);
    res.status(500).json({ message: "返回修改失敗" });
  }
});

// 讀取訂單
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

// 讀取使用者資料
router.get("/checkout/user", async (req, res) => {
  const user_id = req.headers["x-user-id"];
  if (!user_id) {
    return res.status(401).json({ message: "未授權" });
  }
  try {
    const [rows] = await db.execute(
      "SELECT user_email email, user_full_name name, user_phone_number phone, user_city, user_district, user_address FROM user WHERE user_id = ?",
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "找不到用戶" });
    }
    const user = rows[0];
    const result = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address:
        user.user_city && user.user_district && user.user_address
          ? (user.user_city + user.user_district + user.user_address).replace(
              /\s+/g,
              ""
            )
          : "地址資料不完整，請手動輸入",
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("查詢用戶資料失敗:", error);
    res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
  }
});

// 更新訂單and送支付請求給LINE PAY，返回網址
router.patch("/checkout", async (req, res) => {
  const {
    orderId,
    shipping_method,
    shipping_address,
    payment_method,
    recipient_name,
    recipient_email,
    recipient_phone,
    totalPrice,
    deliveryFee,
  } = req.body;

  const connection = await db.getConnection();
  try {
    // 1.更新訂單資訊
    const linepay_uuid = uuidv4();
    const [result] = await db.execute(
      `UPDATE order_list 
       SET shipping_method = ?, shipping_address = ?, payment_method = ?, recipient_name = ?, recipient_email = ?, recipient_phone = ?, linepay_uuid = ?
       WHERE order_id = ?`,
      [
        shipping_method,
        shipping_address,
        payment_method,
        recipient_name,
        recipient_email,
        recipient_phone,
        linepay_uuid,
        orderId,
      ]
    );

    // 檢查是否有任何行被更新
    if (result.affectedRows === 0) {
      throw new Error(`找不到訂單ID: ${orderId}`);
    }

    // 2. 構建支付請求
    const requestBody = {
      amount: totalPrice + deliveryFee,
      currency: "TWD",
      orderId: linepay_uuid,
      packages: [
        {
          id: "test1",
          amount: totalPrice + deliveryFee,
          name: "GOODIVING商店",
          products: [
            {
              name: "潛水商品",
              quantity: 1,
              price: totalPrice,
            },
            {
              name: "運費",
              quantity: 1,
              price: deliveryFee,
            },
          ],
        },
      ],
      redirectUrls: {
        confirmUrl: `http://localhost:3001/cart/checkout/linepay/confirm`, // 支付成功後的跳轉API
        cancelUrl: `http://localhost:3001/cart/cancel`, // 支付取消後的跳轉API
      },
    };

    // 3. 使用工具函數生成 nonce 和 signature
    const { nonce, signature } = generateSignature(
      "/v3/payments/request",
      requestBody
    );

    // 4. 發送支付請求
    const response = await axios.post(
      `${linePayAPIUrl}/v3/payments/request`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-LINE-ChannelId": channelId,
          "X-LINE-Authorization": signature,
          "X-LINE-Authorization-Nonce": nonce,
        },
      }
    );
    console.log({ 請求支付回應: response.data.returnCode });
    // 5. 返回支付URL
    const paymentUrl = response.data.info.paymentUrl.web;
    res.status(200).json({ ok: true, paymentUrl });
  } catch (error) {
    console.error("訂單更新或支付請求失敗:", error);
    res.status(500).json({ ok: false, message: "訂單更新或支付請求失敗" });
  }
});

// 成功付款後的請款API
router.get("/checkout/linepay/confirm", async (req, res) => {
  const { transactionId, orderId } = req.query;
  try {
    // 向DB確認訂單金額與支付金額是否一致
    const [order] = await db.execute(
      `SELECT *
      FROM order_items
      WHERE order_id = (
      SELECT order_id
      FROM order_list
      WHERE linepay_uuid = ?
    );`,
      [orderId]
    );

    const totalAmount = order.reduce((sum, item) => {
      return sum + item.quantity * item.price; // 每個項目的金額加總
    }, 0);

    const requestBody = {
      amount: totalAmount + 60, // 根據實際訂單金額
      currency: "TWD",
    };

    // 1. 生成 nonce 和 signature
    const { nonce, signature } = generateSignature(
      `/v3/payments/${transactionId}/confirm`,
      requestBody
    );

    // 2. 發送支付確認請求
    const response = await axios.post(
      `${linePayAPIUrl}/v3/payments/${transactionId}/confirm`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-LINE-ChannelId": channelId,
          "X-LINE-Authorization": signature,
          "X-LINE-Authorization-Nonce": nonce,
        },
      }
    );
    console.log({ 支付確認回應: response.data.returnCode });
    // 3. 處理支付結果
    if (response.data.returnCode === "0000") {
      // 支付成功，更新資料庫的 is_paid = true
      await db.execute(
        "UPDATE order_list SET is_paid = true WHERE linepay_uuid = ?",
        [orderId]
      );

      setTimeout(() => {
        return res.redirect(
          `http://localhost:3000/cart/complete?orderId=${orderId}`
        );
      }, 5000);
      // 跳轉到成功頁面
    } else {
      // 支付失敗，跳轉到失敗頁面
      return res.redirect(
        "http://localhost:3000/cart/cancel?orderId=${orderId}"
      );
    }
  } catch (error) {
    console.error("支付確認失敗:", error);
    res.status(500).json({ message: "支付確認失敗" });
  }
});

// 訂單完成頁 (用jwt驗證)
router.get("/complete", authMiddleware, async (req, res) => {
  const orderId = req.query.orderId;
  const user_id = req.auth.user_id;
  try {
    const [orders] = await db.execute(
      `SELECT
        p.img_url image,
        p.title,
        p.price,
        oi.quantity,
        v.size,
        v.color
      FROM order_items oi
      JOIN order_list o ON oi.order_id = o.order_id
      JOIN product_variants v ON oi.product_variant_id = v.product_variant_id
      JOIN product_list p ON v.product_id = p.product_id
      WHERE o.linepay_uuid = ? AND o.user_id = ?`,
      [orderId, user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "找不到訂單" });
    }

    const [info] = await db.execute(
      `SELECT payment_method, shipping_method, shipping_address FROM order_list WHERE linepay_uuid = ?`,
      [orderId]
    );
    const { payment_method, shipping_method, shipping_address } = info[0];

    res
      .status(200)
      .json({ orders, payment_method, shipping_method, shipping_address });
  } catch (error) {
    console.error("查詢訂單失敗:", error);
    res.status(500).json({ message: "伺服器錯誤" });
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
      return res
        .status(404)
        .json({ message: "購物車為空或用戶不存在", user_id });
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

export default router;
