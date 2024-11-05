// 會員基本資料的讀取與編輯

import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

router.get("/", async (req, res) =>{
    const sql =`SELECT * FROM user WHERE user_sex = 2`
    const [rows] = await db.query(sql)
    res.json(rows)
    // res.send(`member 目錄下的 /`);
});

export default router;