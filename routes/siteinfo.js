import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

router.get("/api/siteinfo/:id", async (req, res) => {
  try {
    const siteId = req.params.id;
    
    const sql = `
      SELECT 
        si.site_id,
        si.site_name,
        si.x_position,
        si.y_position,
        si.max_depth,
        si.created_at,
        l.level_id,
        l.level_name,
        m.method_id,
        m.method_name,
        sl.location_id,
        sl.location_name,
        sl.location_english
      FROM site_info si
      JOIN level l ON si.level_id = l.level_id
      JOIN method m ON si.method_id = m.method_id
      JOIN site_location sl ON si.location_id = sl.location_id
      WHERE si.site_id = ?
    `;

    const [rows] = await db.query(sql, [siteId]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '找不到資料' 
      });
    }
    res.json({
      success: true,
      data: siteData
    });

  } catch (error) {
    console.error('資料庫查詢錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '資料庫查詢錯誤' 
    });
  }
});