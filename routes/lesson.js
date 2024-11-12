import express from "express";
import db from "../utils/connect-mysql.js";

const app = express();

// /api/blog GET 查詢 (新增分頁和搜尋功能)
app.get('/api/blog', async function (req, res) {
  try {
    const perPage = 10; // 每頁最多顯示 10 筆資料
    let page = parseInt(req.query.page) || 1; // 預設從第 1 頁開始

    // 計算資料的 OFFSET 和 LIMIT
    const offset = (page - 1) * perPage;

    // 基本的 SQL 查詢
    let sql = `SELECT b.*, u.user_full_name FROM blog b 
               JOIN user u ON b.user_id = u.user_id`;

    // 如果有提供關鍵字，則加入 WHERE 條件
    if (req.query.keyword) {
      const keyword = decodeURIComponent(req.query.keyword);
      sql += ` WHERE b.content LIKE '%${keyword}%'`;
    }

    // 添加排序條件
    sql += ' ORDER BY b.created_at DESC';

    // 計算總資料筆數
    const countSql = `SELECT COUNT(*) AS totalRows FROM blog b`;
    if (req.query.keyword) {
      countSql += ` WHERE b.content LIKE '%${decodeURIComponent(req.query.keyword)}%'`;
    }
    const [[{ totalRows }]] = await db.query(countSql);

    // 計算總頁數
    const totalPages = Math.ceil(totalRows / perPage);

    // 獲取當前頁的資料
    sql += ` LIMIT ${perPage} OFFSET ${offset}`;
    const [rows] = await db.query(sql);

    // 回應結果，包含分頁資訊
    res.json({
      totalRows,
      totalPages,
      currentPage: page,
      rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// /api/blog POST 新增
app.post('/api/blog', async function (req, res) {  
  try {
    const { name, content, blog_category } = req.body;  
    const userId = 1;  // 假設使用者 ID 固定為 1

    if (!name || !content || !blog_category) {
      return res.status(400).json({ error: '標題、內容和分類都是必填欄位' });
    }

    // 插入文章的 SQL 語句
    const sql = `INSERT INTO blog (name, content, blog_category, user_id, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, NOW(), NOW());`;

    // 執行 SQL 查詢並傳遞參數
    const [result] = await db.query(sql, [name, content, blog_category, userId]);

    res.json({ message: '文章新增成功', articleId: result.insertId });
  } catch (error) {
    console.error('發生錯誤:', error);
    res.status(500).json({ error: '文章新增失敗，請稍後再試' });
  }
});

// PUT /api/blog PATCH 更新文章
app.patch('/api/blog/:id', async function (req, res) {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: '請提供要更新的標題或內容' });
    }

    const sql = `UPDATE blog SET name = ?, content = ?, updated_at = NOW() WHERE id = ?`;
    await db.query(sql, [title, content, postId]);

    res.json({ message: '文章更新成功' });
  } catch (error) {
    console.error('更新文章失敗:', error);
    res.status(500).json({ error: '更新文章失敗，請稍後再試' });
  }
});

// /api/blog/category
app.get('/api/blog/category', async function (req, res) {
  try {
    const sql = `SELECT * FROM blog_category ORDER BY id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// /api/blog/:id 取得單一文章
app.get('/api/blog/:id', async function (req, res) {
  const postId = req.params.id;
  try {
    const sql = `SELECT b.*, u.user_full_name
                 FROM blog b
                 JOIN user u ON b.user_id = u.user_id
                 WHERE b.id = ?`;

    const [rows] = await db.query(sql, [postId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
