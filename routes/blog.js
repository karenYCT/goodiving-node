import express from "express";
import db from "../utils/connect-mysql.js";

const app = express();

// /api/blog
app.get('/',async function (req, res) {
  try{
    const sql = `SELECT * FROM blog ORDER BY bl_id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

app.get('/:id',async function (req, res) {
  const postId = req.params.id
  try{
    const sql = `SELECT * FROM blog WHERE bl_id =?`; //單一則文章
    const [rows] = await db.query(sql,[postId]);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
  // console.log('id',postId);
  
});



export default app;