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

export default router;
