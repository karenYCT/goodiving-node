import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

// 獲取特定地區的所有潛點
router.get("/api/siteinfo/location/:locationId", async (req, res) => {
  try {
    const locationId = req.params.locationId;
    
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
      WHERE sl.location_id = ?
      ORDER BY si.site_id
    `;

    const [sites] = await db.query(sql, [locationId]);

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        error: '找不到該地區的潛點資料'
      });
    }

    res.json({
      success: true,
      data: sites  // 直接返回查詢結果陣列
    });

  } catch (error) {
    console.error('資料庫查詢錯誤:', error);
    res.status(500).json({
      success: false,
      error: '資料庫查詢錯誤'
    });
  }
});

export default router;