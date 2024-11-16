import express from "express";  // 引入 express 模組，用來建立伺服器
import db from "../utils/connect-mysql.js";  // 引入資料庫連接模組
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();  // 創建一個路由實例，用來定義不同的 API 路徑
const app = express();  // 創建 Express 應用實例

// /api/comment  
app.get('/', async function (req, res) {
  try {
    const sql = `SELECT c.*, u.user_full_name
      FROM blog_comment c
      JOIN user u 
      ON c.user_id = u.user_id
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
    const sql = `SELECT c.*, u.user_full_name 
      FROM blog_comment c
      JOIN user u 
      ON c.user_id = u.user_id 
      WHERE c.bl_id = ? 
      ORDER BY c.created_at DESC
    `;  
      // 查詢指定 blogId 的留言，並按照創建時間倒序排列
    const [rows] = await db.query(sql, [blogId]);  // 執行查詢，並將 blogId 作為參數傳入
    res.json(rows);  // 回傳留言資料
  } catch (error) {
    console.error('獲取留言失敗：', error);  // 在伺服器端顯示錯誤訊息
    res.status(500).json({ error: '獲取留言失敗' });  // 回傳 500 錯誤和相應的錯誤訊息
  }
});

// /api/comment/blog/:blogId (POST) 
app.post('/blog/:blogId', authMiddleware, async function (req, res) {
  try{
    const { blogId } = req.params;
    const { content } = req.body;
    const userId = req.user.user_id;

    // 檢查文章是否存在
    const checkBlogSql = 'SELECT id FROM blog WHERE id = ?';
    const [blogExists] = await db.query(checkBlogSql, [blogId]);
    
    if (blogExists.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 檢查留言內容
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '留言內容不能為空' });
    }

    // 新增留言
    const sql = `INSERT INTO blog_comment (bl_id, user_id, content, created_at) VALUES (?, ?, ?, NOW());`;
    const [result] = await db.query(sql, [blogId, userId, content]);

    // 查詢新增的留言
    const findByIdSql = 'SELECT c.*, u.user_full_name FROM blog_comment c JOIN user u ON c.user_id = u.user_id WHERE c.id = ?';
    const [comments] = await db.query(findByIdSql, [result.insertId]);
    
    res.json(comments[0]);
  } catch (error) {
    console.error('新增留言失敗:', error);
    res.status(500).json({ error: '新增留言失敗，請稍後再試' });
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
