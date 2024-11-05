import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

router.get("/api/siteinfo/:id", async (req, res) => {
  try {
    const siteId = req.params.id;

    const sql = `
      SELECT s.*, 
        l.level_name,
        m.method_name,
        sl.region_name,
        sl.region_english
      FROM site_info s
      JOIN level l USING (level_id)  
      JOIN method m USING (method_id)
      JOIN site_region sl USING (region_id)
      WHERE s.site_id = ?
    `;

    const [rows] = await db.query(sql, [siteId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "找不到資料",
      });
    }
    res.json({
      success: true,
      data: siteData,
    });
  } catch (error) {
    console.error("資料庫查詢錯誤:", error);
    res.status(500).json({
      success: false,
      error: "資料庫查詢錯誤",
    });
  }
});
