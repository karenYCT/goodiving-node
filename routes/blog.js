import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "../utils/upload.js";

const app = express();

// /api/blog GET 查詢










































































app.get('/',async function (req, res) {
  try{
    let sql = `SELECT b.*, u.user_full_name FROM blog b JOIN user u ON b.user_id=u.user_id `;
    if(req.query.keyword){
      sql += `WHERE b.content LIKE '%${decodeURIComponent(req.query.keyword)}%' `
    }
    sql += 'ORDER BY b.created_at DESC'
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

// /api/blog POST 新增
app.post('/', upload.none(), async function (req, res) {  // 設定路由為新增文章
  try {
    const { title: name, content, category } = req.body;  // 從請求的 body 中獲取標題、內容、分類
    const userId = 1;  // 假設使用者 ID 固定為 1，通常應該從登入系統取得

    if (!name|| !content || !category) {
      // 如果缺少標題、內容或分類，回傳 400 錯誤
      // console.log({name,content,category });
      
      return res.status(400).json({ error: '標題、內容和分類都是必填欄位' });
    }

    // 插入文章的 SQL 語句
    const sql = `INSERT INTO blog (name, content, bc_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW());`;

    // 執行 SQL 查詢並傳遞參數
    const [result] = await db.query(sql, [name, content, category, userId]);

    // 回應新增文章結果
    res.json({ message: '文章新增成功', articleId: result.insertId });

  } catch (error) {
    // 錯誤處理
    console.error('發生錯誤:', error);  // 在伺服器端記錄錯誤訊息
    res.status(500).json({ error: '文章新增失敗，請稍後再試' });  // 回傳 500 錯誤及相應的錯誤訊息
  }
});


// PUT
// /api/blog PATCH 更新(部分資料)
app.patch('/:id', async function (req, res) {
  try {
    const postId = req.params.id;  // 獲取文章 ID
    const { title, content } = req.body;  // 從請求體中獲取新的標題和內容

    if (!title && !content) {
      return res.status(400).json({ error: '請提供要更新的標題或內容' });
    }

    // SQL 更新語句
    const sql = `UPDATE blog SET title = ?, content = ?, updated_at = NOW() WHERE id = ?`;
    await db.query(sql, [title, content, postId]);

    res.json({ message: '文章更新成功' });  // 回應成功更新的訊息
  } catch (error) {
    console.error('更新文章失敗:', error);
    res.status(500).json({ error: '更新文章失敗，請稍後再試' });
  }
});



// /api/blog/cateory
app.get('/category',async function (req, res) {
  try{
    const sql = `SELECT * FROM blog_category ORDER BY id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

app.get('/:id',async function (req, res) {
  const postId = req.params.id
  try{
    const sql = `SELECT b.*, u.user_full_name
FROM blog b
JOIN user u ON b.user_id = u.user_id
WHERE b.id = ?;`; //單一則文章
  
    const [rows] = await db.query(sql,[postId]);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});




// /api/blog POST 新增
// app.post('/',async function (req, res) {
//   try{
//     // :TODO
//     // req.bl_name
//     // req.bl_content
//     // req.bc_id
//     // const sql = `INSERT INTO XXXXX`; //單一則文章
//     // const [rows] = await db.query(sql,[postId]);
//     // res.json(rows);
//   }catch(error){
//     // res.status(500).json({ error: error.message });
//   }
// });

export default app;