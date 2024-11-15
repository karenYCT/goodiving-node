import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "../utils/upload.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import path from 'path';


const router = express.Router();

//獲取草稿列表
router.get("/drafts", async (req, res) => {
  try {
    const { region_id } = req.query;
    console.log('收到的區域篩選:', region_id);

    let sql = `
      SELECT 
        l.log_id,
        l.site_id, 
        l.date,
        l.max_depth,
        l.bottom_time,
        l.water_temp,
        l.visi_id,
        l.log_exp,
        l.is_privacy,
        l.is_draft,
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
      WHERE l.is_draft = 1
    `;
    const params = [];

    if (region_id && region_id !== "all") {
      sql += " AND s.region_id = ?";
      params.push(region_id);
      console.log('過濾後的地區:', region_id);
    }

    sql += `ORDER BY l.created_at DESC`;
    console.log('獲取草稿列表的SQL:', sql, '參數:', params);

    const [drafts] = await db.query(sql, params);
    console.log('獲取草稿列表的結果:', drafts);

    const draftsWithImages = await Promise.all(
      drafts.map(async (draft) => {
        const [images] = await db.query(
          `SELECT img_id, img_url, is_main 
          FROM log_img 
          WHERE log_id = ?`,
          [draft.log_id]
        );
        return { ...draft, images };
      })
    );

    res.json(draftsWithImages);
  } catch (error) {
    console.error('獲取草稿列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

//儲存新草稿
router.post("/draft" , async (req, res) => {
  const output = {
    success: false,
    errors: {},
    data: null,
  };

  try {
    console.log("收到的請求資料:", req.body); // 添加記錄

    //準備要儲存的資料
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
      is_draft,
      images = [],
    } = req.body;

    // 轉換日期格式
    const formattedDate = new Date(date).toISOString().slice(0, 10);
    console.log("格式化後的日期:", formattedDate); // 添加記錄

    //新增草稿
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
      is_draft === 1,
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
        // `/img/${file.filename}`,
        `/img/${img.path}`,
        img.isMain || false,
      ]);
      await db.query(imagesSql, [imageValues]);
    }

    output.success = true;
    output.data = {
      log_id,
      message: "草稿儲存成功",
    };

    // 直接回傳結果
    return res.json(output);
  } catch (error) {
    console.error("儲存草稿錯誤:", error);
    output.error = {
      message: "系統錯誤，儲存失敗",
      error: error.message,
    };
    return res.status(500).json(output);
  }
});


// 取得特定區域的潛點（diaryForm潛點區域和潛點名稱）
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

// 取得潛水方式
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

//上傳圖片（最多三張）
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
      path: `/img/${file.filename}`,
      size: file.size,
    }));
    res.json(req.files);
  } catch (error) {
    console.log("檔案上傳錯誤", error);
    res.status(500).json({ error: error.message });
  }
});

//獲取已上傳的圖片
router.get("/img/:filename" , (req, res) => {
  try {
    const { filename } = req.params;
    // 使用相對路徑
    const filepath = path.join("public/img", filename);

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

//獲取所有日誌（包含區域篩選）
router.get("/logs", async (req, res) => {
  try {
    const { region_id } = req.query;
    console.log('收到的區域篩選:', region_id);

    let sql = `
      SELECT 
        l.log_id,
        l.site_id, 
        l.date,
        l.max_depth,
        l.bottom_time,
        l.water_temp,
        l.visi_id,
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
    `;
    const params = [];

    //加入區域過路條件
    if (region_id && region_id !== "all") {
      sql += " AND s.region_id = ?";
      params.push(region_id);
      console.log('過濾後的地區:', region_id); 
    }

    sql += `ORDER BY l.created_at DESC`;
    console.log('獲取日誌列表的SQL:', sql, '參數:', params);

    //執行主查詢
    const [logs] = await db.query(sql, params);
    console.log('獲取日誌列表的結果:', logs);

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

//新增潛水日誌 
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
        // `/img/${file.filename}`,
        `/img/${img.path}`,
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


//讀取單一日誌的內容
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
        l.visi_id,
        l.method_id,
        l.log_exp,
        l.is_privacy,
        l.is_draft,
        l.created_at,
        s.site_name,
        sr.region_name,
        m.method_id,
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

    const [rows] = await db.query(sql, [diary_id]);
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

// 刪除單筆日誌
router.delete("/:log_id", async (req, res) => {
  const output = {
    success: false,
    info: "",
  };

  let log_id = parseInt(req.params.ab_id) || 0;

  if (!log_id) {
    output.info = "日誌編號錯誤";
    return res.json(output);
  }
  
  try{
    //1.先刪除圖片
    const [imageResult] = await db.query(`DELETE FROM log_img WHERE log_id = ?`, [log_id]);
    //2.再刪除日誌
    const [result] = await db.query(`DELETE FROM log WHERE log_id = ?`, [log_id]);

    output.success = !!result.affectedRows;
    if (!output.success){
      output.info = "刪除失敗";
    }
  }catch(ex){
    output.info = "刪除時發生錯誤";
    output.ex = ex;
    console.error('刪除日誌時發生錯誤', ex);
  }
  return res.json(output);
});

// 批量刪除日誌（POST /diary/batch-delete）
router.post("/batch-delete", async (req, res) => {
  const output = {
    success: false,
    info: "",
  };

  const { logIds } = req.body;
  //驗證傳入id的陣列
  if (!Array.isArray(logIds) || logIds.length === 0) {
    output.info = "請提供要刪除的日誌編號";
    return res.json(output);
  }
  //確保所有id都是數字
  const validLogIds = logIds.map(id => parseInt(id)).filter(id => id > 0);
  if (validLogIds.length === 0) {
    output.info = "請提供有效的日誌編號";
    return res.json(output);
  }
  try {
    //1.先刪除圖片
    const [imageResult] = await db.query(`DELETE FROM log_img WHERE log_id IN (?)`, [validLogIds]);
    //2.再刪除日誌
    const [result] = await db.query(`DELETE FROM log WHERE log_id IN (?)`, [validLogIds]);
    output.success = !!result.affectedRows;
    if (!output.success){
      output.info = "刪除失敗";
    }else{
      output.info = '`成功刪除 ${result.affectedRows} 筆日誌`';
    }
  } catch (ex) {
    output.info = "刪除時發生錯誤";
    output.ex = ex;
    console.error('批量刪除日誌時發生錯誤', ex);
  }
  return res.json(output);
});

//更新日誌
router.put("/update/:log_id", async (req, res) => {
  try {
    const logId = req.params.log_id;

    // 1. 先檢查日誌是否存在
    const [existingLog] = await db.query(
    `SELECT l.*, m.method_name, m.method_id
    FROM log l
    LEFT JOIN method m ON l.method_id = m.method_id
    WHERE l.log_id = ?`,
    [logId]
    );

    if (!existingLog || existingLog.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到要更新的日誌'
        }
      });
    }

    const currentLog = existingLog[0];  

    // 2. 從請求中獲取資料，使用現有資料作為預設值
    const {
      date = currentLog.date,
      site_id = currentLog.site_id,
      user_id = currentLog.user_id,
      max_depth = currentLog.max_depth,
      bottom_time = currentLog.bottom_time,
      water_temp = currentLog.water_temp,
      visi_id = currentLog.visi_id,
      method_id = currentLog.method_id,
      log_exp = currentLog.log_exp,
      is_privacy = currentLog.is_privacy,
      images,
    } = req.body;

    // 1. 更新日誌基本資料
    const [updateResult] = await db.query(
      `UPDATE log SET 
        date = ?,
        site_id = ?,
        user_id = ?,
        max_depth = ?,
        bottom_time = ?,
        water_temp = ?,
        visi_id = ?,
        method_id = ?,
        log_exp = ?,
        is_privacy = ?,
        updated_at = NOW()
      WHERE log_id = ?`,
      [
        date,
        site_id,
        user_id,
        max_depth ?? null,
        bottom_time ?? null,
        water_temp ?? null,
        visi_id || null, 
        method_id || null,
        log_exp ?? null,
        is_privacy ? 1 : 0,
        logId
      ]
    );

    // 2.更新圖片
    if (images && Array.isArray(images)) {
      // 先刪除現有的圖片
      await db.query(
        'DELETE FROM log_img WHERE log_id = ?',
        [logId]
      );

      // 過濾掉無效的圖片資料
      const validImages = images.filter(img => img.img_url && img.img_url !== '/img/undefined');
      
      // 如果有新圖片，則插入
      if (images.length > 0) {
        const imageValues = validImages.map(img => [
          logId,
          img.img_url,
          img.is_main
        ]);

        await db.query(
          'INSERT INTO log_img (log_id, img_url, is_main) VALUES ?',
          [imageValues]
        );
      }
    }

    // 3. 獲取更新後的完整日誌資料
    const [updatedLog] = await db.query(`
      SELECT 
        l.*,  
        s.site_name,
        s.region_id,
        sr.region_name,
        m.method_name,
        v.visi_name AS visibility
      FROM log l
      LEFT JOIN site_info s ON l.site_id = s.site_id
      LEFT JOIN site_region sr ON s.region_id = sr.region_id
      LEFT JOIN method m ON l.method_id = m.method_id
      LEFT JOIN visibility v ON l.visi_id = v.visi_id
      WHERE l.log_id = ?
    `, [logId]);
    
    // 4. 獲取更新後的圖片資料
    const [updatedImages] = await db.query(`
      SELECT img_id, img_url, is_main
      FROM log_img
      WHERE log_id = ?
      ORDER BY is_main DESC
    `, [logId]);

    // 5. 回傳更新成功的響應
    res.json({
      success: true,
      data: {
        ...updatedLog[0],
        images: updatedImages
      }
    });

  } catch (error) {
    console.error('更新日誌時發生錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: '更新日誌時發生錯誤',
        details: error.message 
      }
    });
  }
});


// 刪除草稿
router.delete("/draft/:id", async (req, res) => {
  const output = {
    success: false,
    info: "",
  };
    
  try{
    const log_id = parseInt(req.params.id);

    // 確認是否為草稿
    const [draft] = await db.query(
      'SELECT log_id FROM log WHERE log_id = ? AND is_draft = 1',
      [log_id]
    );

    if (!draft.length) {
      output.info = "找不到該草稿";
      return res.status(404).json(output);
    }

    await db.query('DELETE FROM log_img WHERE log_id = ?', [log_id]);
    const [result] = await db.query(
      'DELETE FROM log WHERE log_id = ? AND is_draft = 1',
      [log_id]
    );

    output.success = !!result.affectedRows;
    if (!output.success){
      output.info = "刪除失敗";
    }
  }catch(ex){
    output.info = "刪除時發生錯誤";
    output.ex = ex;
    console.error('刪除日誌時發生錯誤', ex);
  }
  return res.json(output);
});

//更新草稿
router.put("/draft/:id", async (req, res) => {
  try {
    const logId = req.params.log_id;

    // 1. 先檢查日誌是否存在
    const [existingLog] = await db.query(
    `SELECT l.*, m.method_name, m.method_id
    FROM log l
    LEFT JOIN method m ON l.method_id = m.method_id
    WHERE l.log_id = ?`,
    [logId]
    );

    if (!existingLog || existingLog.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: '找不到要更新的草稿'
        }
      });
    }

    const currentLog = existingLog[0];  

    // 2. 從請求中獲取資料，使用現有資料作為預設值
    const {
      date = currentLog.date,
      site_id = currentLog.site_id,
      user_id = currentLog.user_id,
      max_depth = currentLog.max_depth,
      bottom_time = currentLog.bottom_time,
      water_temp = currentLog.water_temp,
      visi_id = currentLog.visi_id,
      method_id = currentLog.method_id,
      log_exp = currentLog.log_exp,
      is_privacy = currentLog.is_privacy,
      images,
    } = req.body;

    // 1. 更新日誌基本資料
    const [updateResult] = await db.query(
      `UPDATE log SET 
        date = ?,
        site_id = ?,
        user_id = ?,
        max_depth = ?,
        bottom_time = ?,
        water_temp = ?,
        visi_id = ?,
        method_id = ?,
        log_exp = ?,
        is_privacy = ?,
        updated_at = NOW()
      WHERE log_id = ?`,
      [
        date,
        site_id,
        user_id,
        max_depth ?? null,
        bottom_time ?? null,
        water_temp ?? null,
        visi_id || null, 
        method_id || null,
        log_exp ?? null,
        is_privacy ? 1 : 0,
        logId
      ]
    );

    // 2.更新圖片
    if (images && Array.isArray(images)) {
      // 先刪除現有的圖片
      await db.query(
        'DELETE FROM log_img WHERE log_id = ?',
        [logId]
      );

      // 過濾掉無效的圖片資料
      const validImages = images.filter(img => img.img_url && img.img_url !== '/img/undefined');
      
      // 如果有新圖片，則插入
      if (images.length > 0) {
        const imageValues = validImages.map(img => [
          logId,
          img.img_url,
          img.is_main
        ]);

        await db.query(
          'INSERT INTO log_img (log_id, img_url, is_main) VALUES ?',
          [imageValues]
        );
      }
    }

    // 3. 獲取更新後的完整日誌資料
    const [updatedLog] = await db.query(`
      SELECT 
        l.*,  
        s.site_name,
        s.region_id,
        sr.region_name,
        m.method_name,
        v.visi_name AS visibility
      FROM log l
      LEFT JOIN site_info s ON l.site_id = s.site_id
      LEFT JOIN site_region sr ON s.region_id = sr.region_id
      LEFT JOIN method m ON l.method_id = m.method_id
      LEFT JOIN visibility v ON l.visi_id = v.visi_id
      WHERE l.log_id = ?  AND l.is_draft = 1
    `, [logId]);
    
    // 4. 獲取更新後的圖片資料
    const [updatedImages] = await db.query(`
      SELECT img_id, img_url, is_main
      FROM log_img
      WHERE log_id = ?
      ORDER BY is_main DESC
    `, [logId]);

    // 5. 回傳更新成功的響應
    res.json({
      success: true,
      data: {
        ...updatedLog[0],
        images: updatedImages
      }
    });

  } catch (error) {
    console.error('更新日誌時發生錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: '更新日誌時發生錯誤',
        details: error.message 
      }
    });
  }
});


//草稿發佈成正式日誌
router.put('/draft/:id/publish', async (req, res) => {
  try {
    const draftId = req.params.id;

    const [draft] =await db.query(
      'SELECT * FROM log WHERE log_id = ? AND is_draft = 1',
      [draftId]
    );
    if(!draft.length){
      return res.status(404).json({ message: '找不到草稿日誌' });
    }

    const [result] = await db.query(
      'UPDATE log SET is_draft = 0, updated_at = NOW() WHERE log_id = ?',
      [draftId]
    );

    res.json({
      success: true,
      message: '日誌發佈成功',
    });

  } catch (error) {
    console.error('發佈日誌時發生錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        message: '發佈日誌時發生錯誤',
        details: error.message 
      }
    });
  }
})
export default router;
