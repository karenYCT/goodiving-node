import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "../utils/upload.js";


const router = express.Router();


// 取得特定區域的潛點（diaryForm潛點區域和潛點名稱）
router.get("/sites/:region_id", async (req, res) => {
  try {
    const { region_id } = req.params;

    const [sites] = await db.query(`
      SELECT site_id, site_name 
      FROM site_info 
      WHERE region_id = ?
      ORDER BY site_name
    `, [region_id]);

    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
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
    console.error('Error fetching diving methods:', error);
    res.status(500).json({ error: 'Failed to fetch diving methods' });
  }
});

//上傳圖片（最多三張）
router.post("/upload", upload.array("images", 3), async(req, res) => {
  console.log('收到上傳請求');
  console.log('檔案資訊:', req.files);
  console.log('請求內容:', req.body);
  try{
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '沒有收到任何檔案' });
    }

    const files = req.files.map(file =>({
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
    }));
  res.json(req.files);
  }catch(error){
    console.log('檔案上傳錯誤',error);
    res.status(500).json({ error: error.message });
  }
});

//獲取已上傳的圖片
router.get("/images/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    // 使用相對路徑
    const filepath = path.join('public/images/diary', filename);
    
    res.sendFile(filepath, { root: '.' }, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(404).json({ error: '照片找不到了！' });
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: '系統錯誤' });
  }
});

//新增潛水日誌
router.post("/add", async (req, res) => {
  const output = {
    success: false,
    errors: {},
    data: null,
  };

  //資料驗證必填欄位
  try{

    // 確保接收到的資料是純物件
    const requestData = JSON.parse(JSON.stringify(req.body));

    //資料驗證必填欄位
    const requiredFields = ['date', 'site_id'];
    const errors = {};
    requiredFields.forEach(field => {
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
      images = []   
    } = req.body;

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
    const [result] = await db.query(sql, [
      date, 
      site_id, 
      user_id, 
      max_depth || null,
      bottom_time || null,
      water_temp || null,
      visi_id || null,
      method_id,
      log_exp || null,
      is_privacy || false,
      is_draft
    ]);

    const log_id = result.insertId;

    //新增圖片
    if (images && images.length > 0){
      const imagesSql = `
      INSERT INTO log_img (log_id, img_url, is_main)
      VALUES ?
    `;

      const imageValues = images.map(img => [
        log_id,
        img.path,
        img.isMain || false
      ]);
      await db.query(imagesSql, [imageValues]);
    }

    output.success = true;
    output.data = {
      log_id,
      message: "新增成功"
    };

    // 直接回傳結果
    return res.json(output);

} catch (error) {
  console.error('新增日誌錯誤:', error);
  output.error = {
    message: "系統錯誤，新增失敗",
    error: error.message
  };
  return res.status(500).json(output);
}
res.json(output);
});



export default router; 