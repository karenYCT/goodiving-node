import express from "express";
import db from "../utils/connect-mysql.js";

const app = express();

// /api/blog GET 查詢
app.get('/',async function (req, res) {
  try{
    let sql = `SELECT * FROM blog `;
    if(req.query.keyword){
      sql += `WHERE content LIKE '%${decodeURIComponent(req.query.keyword)}%' `
    }
    sql += 'ORDER BY created_at DESC'
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

// /api/blog POST 新增
app.post('/',async function (req, res) {
  try{
    // :TODO
    // req.bl_name
    // req.bl_content
    // req.bc_id
    // const sql = `INSERT INTO XXXXX`; //單一則文章
    // const [rows] = await db.query(sql,[postId]);
    // res.json(rows);
  }catch(error){
    // res.status(500).json({ error: error.message });
  }
});

// PUT
// /api/blog PATCH 更新(部分資料)
app.patch('/:id',async function (req, res) {
  try{
    const postId = req.params.id
    // :TODO
    // req.bl_name
    // req.bl_content
    // req.bc_id
    // const sql = `INSERT INTO XXXXX`; //單一則文章
    // const [rows] = await db.query(sql,[postId]);
    // res.json(rows);
  }catch(error){
    // res.status(500).json({ error: error.message });
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
    const sql = `SELECT * FROM blog WHERE id =?`; //單一則文章
    const [rows] = await db.query(sql,[postId]);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});






export default app;