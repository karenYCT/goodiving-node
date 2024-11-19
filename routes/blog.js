import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "../utils/upload.js";
import path from 'path'
import fs from 'fs';
import authMiddleware from "../middlewares/authMiddleware.js";

const app = express();

// /api/blog GET 查詢
app.get('/', async function (req, res) {
  try{
    let sql = `SELECT b.*, u.user_full_name FROM blog b JOIN user u ON b.user_id=u.user_id `;
    if (req.query.keyword) {
      sql += `WHERE b.content LIKE '%${decodeURIComponent(
        req.query.keyword
      )}%' `;
    }
    sql += "ORDER BY b.created_at DESC";
    const [rows] = await db.query(sql);
    const getImageSql = `SELECT images_id FROM images WHERE bl_id = ? AND default_id=0;`;
    const result = await Promise.all(rows.map(async row =>{
      const [rows] = await db.query(getImageSql, [row.id]);
      row.imageId = rows?.[0]?.images_id
      return row
    }));

    res.json(result);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

// /api/blog POST 新增
app.post('/', authMiddleware, upload.none(), async function (req, res) {  // 設定路由為新增文章
  try {
    const { title: name, content, category } = req.body;  // 從請求的 body 中獲取標題、內容、分類
    const userId = req.user.user_id

    if (!name || !content || !category) {
      // 如果缺少標題、內容或分類，回傳 400 錯誤
      // console.log({name,content,category });

      return res.status(400).json({ error: "標題、內容和分類都是必填欄位" });
    }

    // 插入文章的 SQL 語句
    const sql = `INSERT INTO blog (name, content, bc_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW());`;

    // 執行 SQL 查詢並傳遞參數
    const [result] = await db.query(sql, [name, content, category, userId]);

    // 回應新增文章結果
    res.json({ message: "文章新增成功", articleId: result.insertId });
  } catch (error) {
    // 錯誤處理
    console.error("發生錯誤:", error); // 在伺服器端記錄錯誤訊息
    res.status(500).json({ error: "文章新增失敗，請稍後再試" }); // 回傳 500 錯誤及相應的錯誤訊息
  }
});

// PUT
// /api/blog PATCH 更新(部分資料)
app.patch('/:id', authMiddleware, async function (req, res) {
  try {
    const postId = req.params.id; // 獲取文章 ID
    const { title, content } = req.body; // 從請求體中獲取新的標題和內容

    if (!title && !content) {
      return res.status(400).json({ error: "請提供要更新的標題或內容" });
    }

    // SQL 更新語句
    const sql = `UPDATE blog SET title = ?, content = ?, updated_at = NOW() WHERE id = ?`;
    await db.query(sql, [title, content, postId]);

    res.json({ message: "文章更新成功" }); // 回應成功更新的訊息
  } catch (error) {
    console.error("更新文章失敗:", error);
    res.status(500).json({ error: "更新文章失敗，請稍後再試" });
  }
});

// /api/blog/cateory
app.get("/category", async function (req, res) {
  try {
    const sql = `SELECT * FROM blog_category ORDER BY id`;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/:id", async function (req, res) {
  const postId = req.params.id;
  try {
    const sql = `SELECT b.*, u.user_full_name
FROM blog b
JOIN user u ON b.user_id = u.user_id
WHERE b.id = ?;` //單一則文章
  
    const [rows] = await db.query(sql,[postId]);

    const getImageSql = `SELECT images_id FROM images WHERE bl_id = ? AND default_id=0;`;
    const result = await Promise.all(rows.map(async row =>{
      const [rows] = await db.query(getImageSql, [row.id]);
      row.imageIds = rows?.map(row => row.images_id)??[]
      return row
    }));
    res.json(result);
  }catch(error){
    res.status(500).json({ error: error.message });
  }
});

app.post("/:postId/upload", upload.array("images", 3), async (req, res) => {
  console.log("收到上傳請求");
  console.log("檔案資訊:", req.files);
  console.log("請求內容:", req.body);

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "沒有收到任何檔案" });
    }
    const postId = req.params.postId;
    const publicDir = path.join("public", "images", "blog");

    // 確保目標目錄存在，若不存在則建立
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const movedFiles = [];
    for (const file of req.files) {
      const oldPath = file.path;
      const newPath = path.join(publicDir, file.filename);

      // 將檔案遷移到目標目錄
      await fs.promises.rename(oldPath, newPath);

      // 將新檔案資訊加入結果
      movedFiles.push({
        filename: file.filename,
        originalname: file.originalname,
        path: `/images/blog/${file.filename}`, // 更新為新路徑
        size: file.size,
      });
    }

    const sql = `INSERT INTO images (bl_id, path_id) VALUES (?, ?);`;

    await Promise.all(movedFiles.map(async file => {
      await db.query(sql, [postId, file.path]);
    }));

    // 回傳已遷移檔案的資訊
    res.json(movedFiles);
  } catch (error) {
    console.error("檔案上傳錯誤", error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/:postId/images", async (req, res) => {
  try {
    const postId = req.params.postId;

    // 查詢資料庫，獲取與該 postId 關聯的圖片資訊
    const sql = `SELECT images_id FROM images WHERE bl_id = ? AND default_id=0;`;
    const [rows] = await db.query(sql, [postId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "沒有找到相關圖片" });
    }

    // 回傳圖片路徑的列表
    const imageIds = rows.map((row) => row.images_id);
    res.json({ imageIds });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "系統錯誤" });
  }
});

//獲取已上傳的圖片
app.get("/images/:imageId" , async (req, res) => {
  try {
    const imageId = req.params.imageId;
    const sql = `SELECT path_id FROM images WHERE images_id = ?;`;
    const [rows] = await db.query(sql, [imageId]);
    const filePath = path.join("public", rows[0].path_id);
    res.sendFile(filePath, { root: "." }, (err) => {
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




// /api/blog POST 新增
// app.post('/',async function (req, res) {
//   try{
//     // :TODO
//     // req.bl_name
//     // req.bl_content
//     // req.bc_id
//     // const sql = `INSERT INTO XXXXX`; //單一則文章
//     // const [rows] = await db.query(sql,[postId]);
//     // res.json(rows);
//   }catch(error){
//     // res.status(500).json({ error: error.message });
//   }
// });




export default app;
