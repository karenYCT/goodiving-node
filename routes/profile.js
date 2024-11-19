// 會員基本資料的讀取與編輯

import express from "express";
import db from "../utils/connect-mysql.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import upload from "../utils/upload.js";

const router = express.Router();

router.post("/", async (req, res) => {
  //回應給前端的訊息
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: req.body,
    data: {},
  };
  let { user_id } = req.body;
  const sqlUserId = `SELECT * FROM user WHERE user_id = ?`;
  const [rows] = await db.query(sqlUserId, [user_id]);
  console.log("看一下這筆資料rows[0]：" + JSON.stringify(rows[0], null, 2));
  res.json(rows[0]);
  // res.send(`member 目錄下的 /`);
});

router.put("/modify", async (req, res) => {
  //回應給前端的訊息
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: req.body,
    data: {},
  };
  let { id, name, district, address, phone, city } = req.body;

  // 用zod檢查欄位
  const modifyRequestSchema = z.object({
    name: z
      .string()
      .min(2, { message: "請輸入正確的中文姓名" })
      .regex(/^[\u4e00-\u9fa5]+$/, { message: "請輸入正確的中文姓名" }),
    phone: z
      .string()
      .regex(/^09\d{2}-?\d{3}-?\d{3}$/, { message: "請輸入正確的手機格式" }),
  });

  const zodResult = modifyRequestSchema.safeParse({
    name,
    phone,
  });
  if (!zodResult.success) {
    return res.json(zodResult);
  }

  // 檢查通過就進到這裡
  const data = {
    user_id: id,
    user_full_name: name,
    user_phone_number: phone,
    user_district: district,
    user_address: address,
    user_city: city,
  };
  console.log("看一下檢查通過後的data:", data);

  const sqlModifyData = `UPDATE user SET ? WHERE user_id = ?`;
  const [result] = await db.query(sqlModifyData, [data, id]);
  console.log("看一下這筆資料result：" + JSON.stringify(result, null, 4));
  res.json({ ...result, success: !!result.affectedRows });
});

router.put("/modifypsd", async (req, res) => {
  //回應給前端的訊息
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: req.body,
    data: {},
  };
  let { id, oldPassword, newPassword, checkNewPassword } = req.body;

  // 用zod檢查欄位
  const modifyPSDRequestSchema = z.object({
    oldPassword: z
      .string()
      .min(8, { message: "密碼須至少8字元，包含英文及數字" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: "密碼須至少8字元，包含英文及數字",
      }),
    newPassword: z
      .string()
      .min(8, { message: "密碼須至少8字元，包含英文及數字" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: "密碼須至少8字元，包含英文及數字",
      }),
    checkNewPassword: z
      .string()
      .min(8, { message: "密碼須至少8字元，包含英文及數字" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: "密碼須至少8字元，包含英文及數字",
      }),
  });

  const zodResult = modifyPSDRequestSchema.safeParse({
    oldPassword,
    newPassword,
    checkNewPassword,
  });
  if (!zodResult.success) {
    return res.json(zodResult);
  }

  // 密碼檢查:是不是真的是現有密碼
  const sqlFindID = `SELECT * FROM user WHERE user_id = ?`;
  const [rows] = await db.query(sqlFindID, [id]);
  if (rows.length > 0) {
    const passwordResult = await bcrypt.compare(
      oldPassword,
      rows[0].user_password
    );
    console.log("newPassword:", newPassword);
    console.log("rows[0].user_password:", rows[0].user_password);
    console.log("passwordResult:", passwordResult);
    if (!passwordResult) {
      return res.status(409).json({
        success: false,
        error: {
          issues: [
            {
              message: "這不是現在的密碼，請再試一次",
              path: ["oldPassword"],
            },
          ],
        },
      });
    }
  }

  // 檢查新密碼跟確認新密碼是不是一樣的

  // 檢查通過就進到這裡
  newPassword = await bcrypt.hash(newPassword, 12);
  const data = {
    user_id: id,
    user_password: newPassword,
  };

  const sqlModifyPSD = `UPDATE user SET ? WHERE user_id = ?`;
  const [result] = await db.query(sqlModifyPSD, [data, id]);
  console.log("看一下這筆資料result：" + JSON.stringify(result, null, 4));
  res.json({ ...result, success: !!result.affectedRows });
});

// 更新大頭貼
router.put(
  "/upload-avatar",
  upload.single("changeavatar"),
  async (req, res) => {
    //回應給前端的訊息
    const output = {
      success: false,
      code: 0,
      error: "",
      bodyData: req.body,
      data: {},
    };
    const user_id = req.body.user_id;
    const changeavatar = req.file ? req.file.filename : null; // 使用 multer 上傳的文件

    if (!changeavatar || !user_id) {
      output.error = "缺少文件或用戶 ID";
      return res.json(output);
    }

    const sqlUploadAvatar = `UPDATE user SET profile_picture = ? WHERE user_id = ?`;
    const [result] = await db.query(sqlUploadAvatar, [changeavatar, user_id]);
    console.log("看一下更改圖片的result：" + JSON.stringify(result, null, 4));
    res.json({
      ...result,
      success: !!result.affectedRows,
      filename: changeavatar,
    });
  }
);

// 讀取潛水日誌
router.get("/logs", async (req, res) => {
  try {
    const { region_id, user_id } = req.query; // 新增 user_id 參數
    console.log("收到的篩選參數:", { region_id, user_id });

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

    if (region_id && region_id !== "all") {
      sql += " AND s.region_id = ?";
      params.push(region_id);
    }

    if (user_id) {
      sql += " AND l.user_id = ?";
      params.push(user_id); // 篩選指定會員的日誌
    }

    sql += ` ORDER BY l.created_at DESC`;
    console.log("獲取日誌列表的SQL:", sql, "參數:", params);

    const [logs] = await db.query(sql, params);
    console.log("獲取日誌列表的結果:", logs);

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
    console.error("獲取日誌列表失敗:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
