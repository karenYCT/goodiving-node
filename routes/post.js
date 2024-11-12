import express from "express";
import db from "../utils/connect-mysql.js";

// 發布文章
router.post('/blog', async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: '所有欄位都需要填寫' });
  }

  try {
    // 插入文章到資料庫
    const result = await db.query(
      'INSERT INTO blog (title, content, category) VALUES (?, ?, ?)',
      [title, content, category]
    );

    // 返回新創建的文章資料
    const newPost = {
      id: result.blogId,
      title,
      content,
      category,
    };

    res.status(201).json(newPost);
  } catch (error) {
    console.error('文章發布錯誤:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
});

module.exports = router;