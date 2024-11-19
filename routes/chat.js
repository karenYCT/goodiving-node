import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

// 從論壇中私訊別人：創建(語義是提交資源，所以是POST)或查詢對話
router.post("/messages", async (req, res) => {
  // 回應給前端的訊息;
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: {
      會員receiver_user_id: req.body.sender_user_id,
      聊天對象receiver_user_id: req.body.receiver_user_id,
    },
  };

  const { sender_user_id, receiver_user_id } = req.body;
  console.log(
    "看一下按下私訊按鈕後，送到後端的user_id：",
    sender_user_id,
    "跟receiverId：",
    receiver_user_id
  );

  // 檢查過去是否有聊天記錄
  const sqlFindMessage = `SELECT * FROM messages 
  WHERE (sender_user_id = ? AND receiver_user_id = ?) 
  OR (sender_user_id = ? AND receiver_user_id = ?)`;

  try {
    const [existingMessages] = await db.query(sqlFindMessage, [
      sender_user_id,
      receiver_user_id,
      receiver_user_id,
      sender_user_id,
    ]);

    // 1. 如果有聊過天
    if (existingMessages.length > 0) {
      const conversation_id = existingMessages[0].conversation_id;
      console.log("已存在的 conversation_id:", conversation_id);
      // const sqlGetMessages = `SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC`;

      // const [messages] = await db.query(sqlGetMessages, [conversation_id]);

      console.log(
        "這是existingMessages",
        JSON.stringify(existingMessages, null, 4)
      );

      return res.json({
        success: true,
        code: 1001,
        messages: existingMessages,
        conversation_id,
      });
    }

    // 2. 如果沒有聊過天
    const conversation_id = `${sender_user_id}-${receiver_user_id}-${Date.now()}`;
    res.json({
      success: true,
      code: 1002,
      messages: "已建立一個新的聊天室",
      conversation_id, // 新建的 conversation_id
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      code: 1003,
      error: error.message,
    });
  }
});

// 將新訊息存入資料庫中
router.post("/save-message", async (req, res) => {
  const { sender_user_id, receiver_user_id, message, conversation_id } =
    req.body;

  const dataMessages = {
    sender_user_id,
    receiver_user_id,
    message,
    sent_at: new Date(),
    conversation_id,
  };

  try {
    const sqlSaveMessage = `INSERT INTO messages SET ?`;
    const [result] = await db.query(sqlSaveMessage, [dataMessages]);
    res.json({
      success: true,
      code: 1004,
      message: "訊息已儲存進資料庫",
      message_id: result.insertId,
      newMessage: {
        sender_user_id,
        message,
        sent_at: new Date(),
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      code: 1005,
      error: error.message,
    });
  }
});

router.get("/user-name", async (req, res) => {
  //回應給前端的訊息
  const output = {
    success: false,
    code: 0,
    error: "",
  };
  const { receiverId } = req.query;

  if (!receiverId) {
    output.error = "缺少 receiverId";
    return res.json(output);
  }

  try {
    const sqlFindName = `SELECT * FROM user WHERE user_id = ?`;
    const [result] = await db.query(sqlFindName, [receiverId]);

    if (result.length > 0) {
      output.success = true;
      res.json({ ...output, data: result[0] });
    } else {
      output.error = "沒有找到這個用戶";
      res.json(output);
    }
  } catch (error) {
    output.error = "伺服器發生錯誤";
    res.json(output);
  }
});

router.get("/recent-contacts/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const sql = `
  SELECT DISTINCT 
    CASE 
      WHEN sender_user_id = ? THEN receiver_user_id
      ELSE sender_user_id
    END AS contact_id,
    MAX(sent_at) AS last_chat_time
  FROM messages
  WHERE sender_user_id = ? OR receiver_user_id = ?
  GROUP BY contact_id
  ORDER BY last_chat_time DESC
`;

    const [contacts] = await db.query(sql, [user_id, user_id, user_id]);
    res.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "伺服器錯誤，無法獲取最近聊天對象。",
    });
  }
});

router.post("/user-details", async (req, res) => {
  console.log("接收到的 req.body:", req.body); // 檢查請求資料
  const { user_ids } = req.body; // 接收來自前端的 user_id 陣列

  // 檢查是否傳入了 user_ids 並且是陣列
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: "請提供一個包含 user_id 的陣列",
    });
  }

  try {
    // 構造 SQL 查詢語句，使用 IN 運算符
    const sql = `
      SELECT user_id, user_full_name, user_email
      FROM user
      WHERE user_id IN (?)
    `;

    const [results] = await db.query(sql, [user_ids]);

    // 返回查詢結果
    res.json({
      success: true,
      users: results, // 返回查詢到的用戶資料陣列
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      error: "伺服器錯誤，無法獲取用戶資料。",
    });
  }
});

export default router;
