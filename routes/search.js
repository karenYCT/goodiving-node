
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Article = require('../models/article.model');

// 搜尋文章
router.get('/api/posts/search', async (req, res) => {
  try {
    const { term, type, category } = req.query;
    
    let whereClause = {};
    
    // 處理分類過濾
    if (category && category !== '全部') {
      whereClause.category = category;
    }
    
    // 處理搜尋條件
    if (term) {
      switch (type) {
        case 'title':
          whereClause.title = {
            [Op.like]: `%${term}%`
          };
          break;
        case 'content':
          whereClause.content = {
            [Op.like]: `%${term}%`
          };
          break;
        case 'all':
          whereClause[Op.or] = [
            { title: { [Op.like]: `%${term}%` } },
            { content: { [Op.like]: `%${term}%` } }
          ];
          break;
      }
    }
    
    const articles = await Article.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      // 可加入分頁
      // limit: pageSize,
      // offset: (page - 1) * pageSize
    });
    
    res.json(articles);
  } catch (error) {
    console.error('搜尋文章失敗:', error);
    res.status(500).json({ message: '搜尋文章時發生錯誤' });
  }
});

module.exports = router;