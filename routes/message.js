import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();
const app = express();


// /api/massage
app.get('/', async function (req, res) {
  try {
    const sql = `SELECT * FROM message_table ORDER BY message_id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/:blogId', async (req, res) => {
  const { blogId } = req.params; // 確保使用 blogId
  try {
    const sql = 'SELECT * FROM messages_table WHERE blog_id = ? ORDER BY created_at DESC'; // 根據 blogId 過濾
    const [rows] = await db.query(sql, [blogId]); // 使用 blogId 作為查詢參數
    res.json(rows);
  } catch (error) {
    console.error('獲取留言失敗：', error);
    res.status(500).json({ error: '獲取留言失敗' });
  }
});


export default app;