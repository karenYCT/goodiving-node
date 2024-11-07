// app.js (或 server.js)
const express = require('express');
const app = express();

// 假設的資料
const posts = [
  { id: 1, title: '潛水教練文章1', content: '這是潛水教練文章的內容', category: '潛水教練' },
  { id: 2, title: '氣瓶文章1', content: '這是氣瓶文章的內容', category: '氣瓶' },
  { id: 3, title: '裝備文章1', content: '這是裝備文章的內容', category: '裝備' },
  { id: 4, title: '課程文章1', content: '這是課程文章的內容', category: '課程' },
  { id: 5, title: '潛點文章1', content: '這是潛點文章的內容', category: '潛點' },
];

// API：根據分類返回文章
app.get('/api/posts', (req, res) => {
  const { category } = req.query;
  if (category && category !== '全部') {
    const filteredPosts = posts.filter(post => post.category === category);
    return res.json(filteredPosts);
  }
  return res.json(posts);
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
  