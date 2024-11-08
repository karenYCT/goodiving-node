import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();
const app = express();

// /api/comment  
app.get('/', async function (req, res) {
  try {
    const sql = `SELECT * FROM blog_comment ORDER BY created_at DESC`;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/blog/:blogId', async (req, res) => {
  const { blogId } = req.params; // 確保使用 blogId
  try {
    const sql = 'SELECT * FROM blog_comment WHERE bl_id = ? ORDER BY created_at DESC'; // 根據 blogId 過濾
    
    const [rows] = await db.query(sql, [blogId]); // 使用 blogId 作為查詢參數
    res.json(rows);
  } catch (error) {
    console.error('獲取留言失敗：', error);
    res.status(500).json({ error: '獲取留言失敗' });
  }
});

// blog/1/comment  
// comment/blog/1
app.post('/blog/:blogId', async function (req, res) {
  try{
    const { blogId } = req.params;
    const { content } = req.body
    const userId = 1
    const sql = `INSERT INTO blog_comment (bl_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW());`; 
    const [rows] = await db.query(sql,[blogId, userId, content]);
    const findByIdSql = 'SELECT * FROM blog_comment WHERE id = ?'; 
    const [comments] = await db.query(findByIdSql,[rows.insertId]);    
    res.json(comments[0]);
  }catch(error){
    
    res.status(500).json({ error: error.message });
  }
});

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



export default app;