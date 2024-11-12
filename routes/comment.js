import express from "express";  // 引入 express 模組，用來建立伺服器
import db from "../utils/connect-mysql.js";  // 引入資料庫連接模組

const router = express.Router();  // 創建一個路由實例，用來定義不同的 API 路徑
const app = express();  // 創建 Express 應用實例

// /api/comment  
app.get('/', async function (req, res) {
  try {
    const sql = `SELECT c.*, u.user_full_name
FROM blog_comment c
JOIN user u ON c.user_id = u.user
WHERE c.bl_id = ?
ORDER BY c.created_at DESC;
`; // 查詢所有留言，並按照創建時間倒序排列
    const [rows] = await db.query(sql);  // 執行 SQL 查詢，並將結果賦值給 rows
    res.json(rows);  // 回傳留言資料
  } catch (error) {
    res.status(500).json({ error: error.message });  // 如果發生錯誤，回傳 500 錯誤和錯誤訊息
  }
});

// /api/comment/blog/:blogId
app.get('/blog/:blogId', async (req, res) => {
  const { blogId } = req.params;  // 從路徑參數中獲取 blogId
  try {
    const sql = `SELECT * FROM blog_comment WHERE bl_id = ? ORDER BY created_at DESC`;  // 查詢指定 blogId 的留言，並按照創建時間倒序排列
    const [rows] = await db.query(sql, [blogId]);  // 執行查詢，並將 blogId 作為參數傳入
    res.json(rows);  // 回傳留言資料
  } catch (error) {
    console.error('獲取留言失敗：', error);  // 在伺服器端顯示錯誤訊息
    res.status(500).json({ error: '獲取留言失敗' });  // 回傳 500 錯誤和相應的錯誤訊息
  }
});

// /api/comment/blog/:blogId (POST) 
app.post('/blog/:blogId', async function (req, res) {
  try{
    const { blogId } = req.params;  // 從路徑參數中獲取 blogId
    const { content } = req.body;  // 從請求的 body 中獲取留言內容
    const userId = 1;  // 假設使用者 ID 固定為 1（通常會從登入系統中取得）
    const sql = `INSERT INTO blog_comment (bl_id, user_id, content, created_at) VALUES (?, ?, ?, NOW());`;  // 插入新留言
    const [rows] = await db.query(sql, [blogId, userId, content]);  // 執行插入操作，並將 blogId, userId, content 參數傳入

    const findByIdSql = 'SELECT * FROM blog_comment WHERE id = ?';  // 根據插入的留言 ID 查詢留言
    const [comments] = await db.query(findByIdSql, [rows.insertId]);  // 根據插入的 ID 查詢該留言
    res.json(comments[0]);  // 回傳新插入的留言資料
  } catch (error) {
    res.status(500).json({ error: error.message });  // 如果發生錯誤，回傳 500 錯誤和錯誤訊息
  }
});

// 尚未實作的更新留言部分，可能是需要後續的擴充功能
// app.patch('/blog/:blogId', async function (req, res) {
//   try{
//     const { blogId } = req.params;
//     const { content } = req.body
//     const userId = 1
//     const sql = `UPDATE INTO blog_comment (bl_id, user_id, content, updated_at) VALUES (?, ?, ?, NOW());`; 
//     const [rows] = await db.query(sql,[blogId, userId, content]);
//     const findByIdSql = 'SELECT * FROM blog_comment WHERE id = ?'; 
//     const [comments] = await db.query(findByIdSql,[rows.insertId]);    
//     res.json(comments[0]);
//   }catch(error){
//     res.status(500).json({ error: error.message });
//   }
// });

export default app;  // 匯出 app 物件
