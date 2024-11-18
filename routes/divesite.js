import express from "express";
import db from "../utils/connect-mysql.js";

const router = express.Router();

// 取得所有潛點
// router.get("/all", async (req, res) => {
//   try {
//     const sql = `
//     SELECT 
//       si.site_id,
//       si.site_name,
//       si.max_depth,
//       si.region_id,
//       si.created_at,
//       l.level_name,
//       l.level_id,
//       m.method_name,
//       m.method_id,
//       r.region_name,
//       r.region_english,
//       img.img_url,
//       img.site_intro
//     FROM site_info si
//     JOIN level l ON si.level_id = l.level_id
//     JOIN method m ON si.method_id = m.method_id
//     JOIN site_region r ON si.region_id = r.region_id
//     LEFT JOIN site_img img ON si.site_id = img.site_id
//     WHERE (img.img_main = 1 OR img.img_main IS NULL)
//     ORDER BY si.site_id`;
    
//     const [rows] = await db.query(sql);
//     res.json(rows);
//   } catch(error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.get("/all", async (req, res) => {
  try {
    const sql = `
    SELECT 
      si.site_id,
      si.site_name,
      si.max_depth,
      si.region_id,
      si.created_at,
      l.level_name,
      l.level_id,
      m.method_name,
      m.method_id,
      r.region_name,
      r.region_english,
      GROUP_CONCAT(
        JSON_OBJECT(
          'img_url', img.img_url,
          'site_intro', img.site_intro,
          'img_main', img.img_main
        ) SEPARATOR '|||'
      ) as images
    FROM site_info si
    JOIN level l ON si.level_id = l.level_id
    JOIN method m ON si.method_id = m.method_id
    JOIN site_region r ON si.region_id = r.region_id
    LEFT JOIN site_img img ON si.site_id = img.site_id
    GROUP BY si.site_id
    ORDER BY si.site_id`;
    
    const [rows] = await db.query(sql);

    // 處理結果，將 images 字串轉換為陣列
    const processedRows = rows.map(row => {
      try {
        // 處理 images 字串，使用 ||| 分隔符分割並解析
        const images = row.images 
          ? row.images.split('|||').map(img => {
              try {
                return JSON.parse(img);
              } catch (e) {
                console.error('Parse image error:', e);
                return null;
              }
            }).filter(img => img !== null)
          : [];
        
        // 找出主圖
        const mainImage = images.find(img => img.img_main === 1) || images[0] || null;
        
        return {
          ...row,
          images: images,
          img_url: mainImage ? mainImage.img_url : null,
          site_intro: mainImage ? mainImage.site_intro : null
        };
      } catch (e) {
        console.error(`Error processing row ${row.site_id}:`, e);
        return {
          ...row,
          images: [],
          img_url: null,
          site_intro: null
        };
      }
    });

    res.json(processedRows);
  } catch(error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/coordinates/:region_id", async (req, res) => {
  try {
    const sql = `
    SELECT 
      si.site_id,
      si.site_name,
      si.x_position,
      si.y_position,
      si.max_depth,
      r.region_name,
      r.region_english,
      m.method_id,
      m.method_name,
      img.img_url
    FROM site_info si
    JOIN site_region r ON si.region_id = r.region_id
    JOIN method m ON si.method_id = m.method_id
    LEFT JOIN site_img img ON si.site_id = img.site_id
    WHERE si.region_id = ? 
    AND (img.img_main = 1 OR img.img_main IS NULL)
    ORDER BY si.site_id
    `;
    
    const [rows] = await db.query(sql, [req.params.region_id]);
    res.json(rows);
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});

// 通過 region_englowercase 取得地區資料
router.get("/region-by-lowercase/:englowercase", async (req, res) => {
  try {
    const sql = `
      SELECT *
      FROM site_region 
      WHERE region_englowercase = ?
    `;
    const [rows] = await db.query(sql, [req.params.englowercase]);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Region not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得地區
router.get("/region", async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT 
        sr.region_id,
        sr.region_name,
        sr.region_english,
        sr.region_englowercase
      FROM site_info si
      JOIN site_region sr ON si.region_id = sr.region_id
      ORDER BY sr.region_id
    `;
    const [rows] = await db.query(sql);
    
    res.json(rows);
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});
// router.get("/region", async (req, res) => {
//   try{
//     const sql = `SELECT * FROM site_region ORDER BY region_id`;
//     const [rows] = await db.query(sql);
//     res.json(rows);
//   }catch(error){
//     res.status(500).json({ error: error.message });
//   }
// });

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

// 獲取特定潛點的公開日誌
router.get("/logs/:site_id", async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.log_id,
        l.site_id,
        l.user_id,
        l.date,
        l.max_depth,
        l.bottom_time,
        l.water_temp,
        l.log_exp,
        l.created_at,
        v.visi_name,
        m.method_name,
        u.user_id,
        u.user_full_name,
        GROUP_CONCAT(
          JSON_OBJECT(
            'img_url', li.img_url,
            'img_id', li.img_id,
            'is_main', li.is_main
          )
        ) as images
      FROM log l
      JOIN visibility v ON l.visi_id = v.visi_id
      JOIN method m ON l.method_id = m.method_id
      JOIN user u ON l.user_id = u.user_id
      LEFT JOIN log_img li ON l.log_id = li.log_id
      WHERE l.site_id = ?
      AND l.is_privacy = 1
      AND l.is_draft = 0
      GROUP BY l.log_id
      ORDER BY l.date DESC
      LIMIT 10
    `;
    
    const [rows] = await db.query(sql, [req.params.site_id]);

    // 處理每個日誌的圖片數據
    const processedRows = rows.map(row => {
      try {
        const images = row.images 
          ? JSON.parse(`[${row.images}]`)
          : [];
        
        // 找出主圖或第一張圖
        const mainImage = images.find(img => img.is_main === 1) || images[0] || null;
        
        return {
          ...row,
          images: images,
          main_img_url: mainImage ? mainImage.img_url : null
        };
      } catch (e) {
        console.error(`Error processing images for log ${row.log_id}:`, e);
        return {
          ...row,
          images: [],
          main_img_url: null
        };
      }
    });

    res.json(processedRows);
  } catch(error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/log/:log_id", async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.log_id,
        l.site_id,
        l.user_id,
        l.date,
        l.max_depth,
        l.bottom_time,
        l.water_temp,
        l.log_exp,
        l.is_privacy,
        l.created_at,
        s.site_name,
        v.visi_name as visibility,
        m.method_name,
        u.user_full_name as user_name,
        GROUP_CONCAT(
          JSON_OBJECT(
            'img_url', li.img_url,
            'img_id', li.img_id,
            'is_main', li.is_main
          )
        ) as images
      FROM log l
      JOIN site_info s ON l.site_id = s.site_id
      JOIN visibility v ON l.visi_id = v.visi_id
      JOIN method m ON l.method_id = m.method_id
      JOIN user u ON l.user_id = u.user_id
      LEFT JOIN log_img li ON l.log_id = li.log_id
      WHERE l.log_id = ?
      GROUP BY l.log_id
    `;
    
    const [rows] = await db.query(sql, [req.params.log_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Log not found' });
    }

    // 處理圖片數據
    const processedRow = {
      ...rows[0],
      images: rows[0].images 
        ? JSON.parse(`[${rows[0].images}]`)
        : []
    };

    res.json(processedRow);
  } catch(error) {
    console.error('SQL Error:', error);
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
      si.region_id,
      l.level_name,
      l.level_id,
      m.method_name,
      m.method_id,
      r.region_name,
      r.region_english,
      img.img_url,
      img.site_intro
    FROM site_info si
    JOIN level l ON si.level_id = l.level_id
    JOIN method m ON si.method_id = m.method_id
    JOIN site_region r ON si.region_id = r.region_id
    LEFT JOIN site_img img ON si.site_id = img.site_id
    WHERE (img.img_main = 1 OR img.img_main IS NULL)`;
    
    // 如果不是 'all'，添加地區過濾條件
    const params = [];
    if (regionId !== 'all') {
      sql += ` AND si.region_id = ?`;
      params.push(regionId);
    }
    
    sql += ` ORDER BY si.site_id`;
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch(error) {
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
        img.img_url,
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
    si.region_id,
    l.level_name,
    l.level_id,
    m.method_name,
    m.method_id,
    r.region_name,
    r.region_english,
    img.img_url,
    img.site_intro
  FROM site_info si
  JOIN level l ON si.level_id = l.level_id
  JOIN method m ON si.method_id = m.method_id
  JOIN site_region r ON si.region_id = r.region_id
  LEFT JOIN site_img img ON si.site_id = img.site_id
  WHERE (img.img_main = 1 OR img.img_main IS NULL)
  `;
  const params = [];

  // 動態添加搜尋條件
  if (keyword) {
    sql += ` AND (si.site_name LIKE ? OR r.region_name LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (region_id && region_id !== 'all') {
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
} catch(error) {
  res.status(500).json({ error: error.message });
}
});


export default router;
