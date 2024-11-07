// 會員基本資料的讀取與編輯

import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

router.post("/", async (req, res) => {
  //回應給前端的訊息
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: req.body,
    data: {},
  };
  let { user_id } = req.body;
  const sqlUserId = `SELECT * FROM user WHERE user_id = ?`;
  const [rows] = await db.query(sqlUserId, [user_id]);
  console.log("看一下這筆資料rows[0]：" + JSON.stringify(rows[0], null, 2));
  res.json(rows[0]);
  // res.send(`member 目錄下的 /`);
});

export default router;
