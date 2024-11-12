import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "../utils/upload.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// 取得特定區域的潛點（diaryForm潛點區域和潛點名稱）- 不需要驗證
router.get("/sites/:region_id", async (req, res) => {
  try {
    const { region_id } = req.params;

    const [sites] = await db.query(
      `
      SELECT site_id, site_name 
      FROM site_info 
      WHERE region_id = ?
      ORDER BY site_name
    `,
      [region_id]
    );

    res.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    res.status(500).json({ error: "Failed to fetch sites" });
  }
});

// 取得潛水方式- 不需要驗證
router.get("/methods", async (req, res) => {
  try {
    const [methods] = await db.query(`
      SELECT method_id, method_name 
      FROM method 
      ORDER BY method_name
    `);

    res.json(methods);
  } catch (error) {
    console.error("Error fetching diving methods:", error);
    res.status(500).json({ error: "Failed to fetch diving methods" });
  }
});

//上傳圖片（最多三張）- 需要驗證
router.post("/upload", upload.array("images", 3),async (req, res) => {
  console.log("收到上傳請求");
  console.log("檔案資訊:", req.files);
  console.log("請求內容:", req.body);
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "沒有收到任何檔案" });
    }

    const files = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
    }));
    res.json(req.files);
  } catch (error) {
    console.log("檔案上傳錯誤", error);
    res.status(500).json({ error: error.message });
  }
});

//獲取已上傳的圖片
router.get("/images/:filename" , (req, res) => {
  try {
    const { filename } = req.params;
    // 使用相對路徑
    const filepath = path.join("public/images/diary", filename);

    res.sendFile(filepath, { root: "." }, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(404).json({ error: "照片找不到了！" });
      }
    });
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "系統錯誤" });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.log_id,
        l.date,
        l.max_depth,
        l.bottom_time,
        l.water_temp,
        l.log_exp,
        l.is_privacy,
        l.created_at,
        s.site_name,
        s.region_id,
        sr.region_name,
        m.method_name,
        m.method_id,
        v.visi_name AS visibility,
        u.user_full_name
      FROM log l
      LEFT JOIN site_info s ON l.site_id = s.site_id
      LEFT JOIN site_region sr ON s.region_id = sr.region_id
      LEFT JOIN method m ON l.method_id = m.method_id
      LEFT JOIN visibility v ON l.visi_id = v.visi_id
      LEFT JOIN user u ON l.user_id = u.user_id
      WHERE l.is_draft = 0
      ORDER BY l.created_at DESC
    `;
    
    const [logs] = await db.query(sql);

    // 獲取每個日誌的圖片
    const logsWithImages = await Promise.all(
      logs.map(async (log) => {
        const [images] = await db.query(
          `SELECT img_id, img_url, is_main 
          FROM log_img 
          WHERE log_id = ?`,
          [log.log_id]
        );
        return { ...log, images };
      })
    );

    res.json(logsWithImages);
  } catch (error) {
    console.error('獲取日誌列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

//新增潛水日誌 - 需要驗證
router.post("/add" , async (req, res) => {
  const output = {
    success: false,
    errors: {},
    data: null,
  };

  //資料驗證必填欄位
  try {
    console.log("收到的請求資料:", req.body); // 添加記錄

    //資料驗證必填欄位
    const requiredFields = ["date", "site_id"];
    const errors = {};

    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        errors[field] = `${field} 為必填欄位`;
      }
    });

    if (Object.keys(errors).length > 0) {
      output.errors = errors;
      return res.status(400).json(output);
    }

    //準備要新增的資料
    const {
      date,
      site_id,
      user_id,
      max_depth,
      bottom_time,
      water_temp,
      visi_id,
      method_id,
      log_exp,
      is_privacy,
      is_draft = false,
      images = [],
    } = req.body;

    // 轉換日期格式
    const formattedDate = new Date(date).toISOString().slice(0, 10);
    console.log("格式化後的日期:", formattedDate); // 添加記錄

    //新增潛水日誌
    const sql = `
    INSERT INTO log (
        date, 
        site_id, 
        user_id, 
        max_depth, 
        bottom_time, 
        water_temp, 
        visi_id,
        method_id,
        log_exp,
        is_privacy,
        is_draft,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      formattedDate, // 使用格式化後的日期
      site_id,
      user_id,
      max_depth || null,
      bottom_time || null,
      water_temp || null,
      visi_id || null,
      method_id || null,
      log_exp || null,
      is_privacy || false,
      is_draft,
    ];
    console.log("SQL 參數:", params); // 添加記錄

    const [result] = await db.query(sql, params);
    console.log("SQL 執行結果:", result); // 添加記錄

    const log_id = result.insertId;

    //新增圖片
    if (images && images.length > 0) {
      console.log("準備插入圖片:", images); // 添加記錄

      const imagesSql = `
      INSERT INTO log_img (log_id, img_url, is_main)
      VALUES ?
    `;

      const imageValues = images.map((img) => [
        log_id,
        img.path,
        img.isMain || false,
      ]);
      await db.query(imagesSql, [imageValues]);
    }

    output.success = true;
    output.data = {
      log_id,
      message: "新增成功",
    };

    // 直接回傳結果
    return res.json(output);
  } catch (error) {
    console.error("新增日誌錯誤:", error);
    output.error = {
      message: "系統錯誤，新增失敗",
      error: error.message,
    };
    return res.status(500).json(output);
  }
  res.json(output);
});
//讀取單一日誌的內容- 需要驗證
router.get("/:diary_id", async (req, res) => {
  try {
    const { diary_id } = req.params;

    const sql = `
      SELECT 
        l.log_id,
        l.date,
        l.max_depth,
        l.bottom_time,
        l.water_temp,
        l.log_exp,
        l.is_privacy,
        l.created_at,
        s.site_name,
        sr.region_name,
        s.max_depth AS site_max_depth,
        m.method_name,
        v.visi_name AS visibility,
        u.user_full_name
      FROM log l
      LEFT JOIN site_info s ON l.site_id = s.site_id
      LEFT JOIN site_region sr ON s.region_id = sr.region_id
      LEFT JOIN method m ON l.method_id = m.method_id
      LEFT JOIN visibility v ON l.visi_id = v.visi_id
      LEFT JOIN user u ON l.user_id = u.user_id
      WHERE l.log_id = ?
    `;
    
    // 修正：加入參數到查詢中
    const [rows] = await db.query(sql, [diary_id]);
    
    // if (rows.length === 0) {
    //   return res.status(404).json({ error: "日誌不存在或無權限查看" });
    // }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('查詢出錯:', error);
    res.status(500).json({ 
      error: error.message,
      details: '讀取日誌時發生錯誤'
    });
  }
});


//讀取單一日誌的照片
router.get("/images/:diary_id" , async (req, res) => {
  const sql = `SELECT 
        img_id,
        img_url,
        is_main
    FROM log_img
    WHERE log_id = ?
    ORDER BY is_main DESC;`;
  try {
    const [rows] = await db.query(sql, [req.params.diary_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
