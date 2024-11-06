import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

// 取得所有地區的潛點
router.get("/region", async (req, res) => {
  try{
    const sql = `SELECT * FROM site_region ORDER BY region_id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

// 取得潛水方法
router.get("/method", async (req, res) => {
  try{
    const sql = `SELECT * FROM method ORDER BY method_id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

// 取得難易度
router.get("/level", async (req, res) => {
  try{
    const sql = `SELECT * FROM level ORDER BY level_id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});


// 取得特定地區的潛點
router.get("/region/:region_id", async (req, res) => {
  try{
    const sql = `
    SELECT 
      si.site_id,
      si.site_name,
      si.x_position,
      si.y_position,
      si.max_depth,
      si.created_at,
      l.level_name,
      m.method_name,
      r.region_name,
      r.region_english,
      img.site_img_path,
      img.site_intro
    FROM site_info si
    JOIN level l ON si.level_id = l.level_id
    JOIN method m ON si.method_id = m.method_id
    JOIN site_region r ON si.region_id = r.region_id
    LEFT JOIN site_img img ON si.site_id = img.site_id
    WHERE si.region_id = ? 
    AND (img.img_main = 1 OR img.img_main IS NULL)
    ORDER BY si.site_id`;
    
    const [rows] = await db.query(sql, [req.params.region_id]);
    res.json(rows);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

// 取得單一潛點的詳細資料
router.get("/:site_id", async (req, res) => {
  const sql = 
      `SELECT 
        si.site_id,
        si.site_name,
        si.x_position,
        si.y_position,
        si.max_depth,
        si.created_at,
        l.level_name,
        m.method_name,
        r.region_name,
        r.region_english,
        img.site_img_path,
        img.site_intro
      FROM site_info si
      JOIN level l ON si.level_id = l.level_id
      JOIN method m ON si.method_id = m.method_id
      JOIN site_region r ON si.region_id = r.region_id
      LEFT JOIN site_img img ON si.site_id = img.site_id
      WHERE si.site_id = ?
      AND (img.img_main = 1 OR img.img_main IS NULL)
    `;

    try {
      const [rows] = await db.query(sql, [req.params.site_id]);  // 傳入 site_id 參數
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// 搜尋
router.get("/search ", async(req,res)=>{
try {
  const { keyword, region_id, method_id, level_id } = req.query;

  let sql = `
  SELECT 
        si.site_id,
        si.site_name,
        si.x_position,
        si.y_position,
        si.max_depth,
        si.created_at,
        l.level_name,
        m.method_name,
        r.region_name,
        r.region_english,
        img.site_img_path,
        img.site_intro
      FROM site_info si
      JOIN level l ON si.level_id = l.level_id
      JOIN method m ON si.method_id = m.method_id
      JOIN site_region r ON si.region_id = r.region_id
      LEFT JOIN site_img img ON si.site_id = img.site_id
      WHERE si.site_id = ?
      AND (img.img_main = 1 OR img.img_main IS NULL)
  `;
  const params = [];
    // 動態添加搜尋條件
    if (keyword) {
      sql += ` AND (si.site_name LIKE ? OR r.region_name LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (region_id) {
      sql += ` AND si.region_id = ?`;
      params.push(region_id);
    }

    if (method_id) {
      sql += ` AND si.method_id = ?`;
      params.push(method_id);
    }

    if (level_id) {
      sql += ` AND si.level_id = ?`;
      params.push(level_id);
    }

    sql += ` ORDER BY si.site_id`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
    }catch(error) {
      res.status(500).json({ error: error.message });
    }
});
export default router;