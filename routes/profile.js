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

export default router;
