// 登入、登出、註冊相關的路由

import express from "express";
import db from "../utils/connect-mysql.js";
import upload from "../utils/upload.js";
import { z } from "zod";
import moment from "moment-timezone";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// 登入的邏輯
router.post("/login", upload.none(), async (req, res) => {
  //回應給前端的訊息
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: req.body,
    data: {},
  };
  let { email, password } = req.body;

  // 帳密是否都有值
  if (!email || !password) {
    output.code = 100;
    output.error = "請輸入帳號及密碼";
    return res.json(output);
  }

  // 帳號是不是對的(是否有找到帳號)
  const sqlFindEmail = `SELECT * FROM user WHERE user_email = ?`;
  const [rows] = await db.query(sqlFindEmail, [email]);
  console.log("看一下這筆資料rows[0]：" + JSON.stringify(rows[0], null, 2));
  if (!rows.length) {
    output.code = 400;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 密碼是不是對的
  const passwordResult = await bcrypt.compare(password, rows[0].user_password);
  if (!passwordResult) {
    output.code = 450;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 如果帳號密碼都正確，可以開始生成 Token
  const payload = {
    user_id: rows[0].user_id,
    user_full_name: rows[0].user_full_name,
    role_id: rows[0].role_id,
  };

  console.log("process.env.JWT_KEY是:", process.env.JWT_KEY);
  const token = jwt.sign(payload, process.env.JWT_KEY);

  output.data = {
    user_id: rows[0].user_id,
    user_email: rows[0].user_email,
    user_full_name: rows[0].user_full_name,
    role_id: rows[0].role_id,
    token,
  };

  output.success = true;
  output.message = "登入成功";
  res.json(output);
});

// 登出的邏輯
router.post("/logout", (req, res) => {
  res.send("已登出");
});

// 註冊的邏輯
router.post("/register", async (req, res) => {
  let { email, name, password, birthday, phone, sex, checkpassword } = req.body;
  console.log("從前端收到的req.body是:", req.body);

  // 先將 birthday 從字串轉換為 Date 物件， Zod 驗證的 Date 欄位期望的是一個 Date 物件，但前端傳過來的 birthday 是一個格式化的字串 ("YYYY-MM-DD")。
  if (birthday) {
    birthday = new Date(birthday); // 將生日格式轉換
  }

  // 用zod檢查欄位
  const registerRequestSchema = z.object({
    email: z
      .string()
      .email({ message: "請輸入正確的Email格式" })
      .min(1, { message: "Email 為必填欄位" }),
    name: z
      .string()
      .min(2, { message: "請輸入正確的中文姓名" })
      .regex(/^[\u4e00-\u9fa5]+$/, { message: "請輸入正確的中文姓名" }),
    password: z
      .string()
      .min(8, { message: "密碼須至少8字元，包含英文及數字" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: "密碼須至少8字元，包含英文及數字",
      }),
    checkpassword: z
      .string()
      .min(8, { message: "密碼須至少8字元，包含英文及數字" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: "密碼須至少8字元，包含英文及數字",
      }),
    phone: z
      .string()
      .regex(/^09\d{2}-?\d{3}-?\d{3}$/, { message: "請輸入正確的手機格式" }),
    sex: z.enum(["1", "2"], { message: "請選擇性別" }),
    birthday: z.date({
      required_error: "生日為必填欄位",
      invalid_type_error: "請輸入有效的日期格式",
    }),
  });

  const zodResult = registerRequestSchema.safeParse({
    email,
    name,
    password,
    checkpassword,
    phone,
    sex,
    birthday,
  });
  if (!zodResult.success) {
    return res.json(zodResult);
  }

  // moment 生日檢查
  birthday = moment(birthday);
  if (birthday.isValid()) {
    birthday = birthday.format("YYYY-MM-DD");
  } else {
    return res.json({
      success: false,
      error: {
        issues: [
          {
            message: "生日為必填欄位",
            path: ["email"],
          },
        ],
      },
    });
  }

  // email檢查
  const sqlFindEmail = `SELECT * FROM user WHERE user_email = ?`;
  const [rows] = await db.query(sqlFindEmail, [email]);
  if (rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: {
        issues: [
          {
            message: "該電子郵件已被註冊",
            path: ["email"],
          },
        ],
      },
    });
  }

  const avatar =
    sex == 1 ? "/member/man-avatar.jpg" : "/member/woman-avatar.jpg";

  password = await bcrypt.hash(password, 12);

  // 檢查通過就進到這裡
  const data = {
    is_active: 0, // 預設為未完成email驗證
    user_email: email,
    user_password: password,
    user_birthday: birthday,
    user_full_name: name,
    user_phone_number: phone,
    profile_picture: avatar,
    user_sex: sex,
    role_id: 0, // 預設為一般使用者角色
    user_created_at: new Date(),
  };

  console.log("看一下data", data);

  // SQL語法
  const sqlRegister = `INSERT INTO user SET ?`;
  const [result] = await db.query(sqlRegister, [data]);

  const [newUser] = await db.query(sqlFindEmail, [email]);

  // 新增到資料庫之後，可以開始生成 Token
  const payload = {
    user_id: newUser[0].user_id,
    user_full_name: newUser[0].user_full_name,
    role_id: newUser[0].role_id,
  };

  console.log("新註冊的JWT_KEY是:", process.env.JWT_KEY);
  const token = jwt.sign(payload, process.env.JWT_KEY);

  result.data ={
    user_id: newUser[0].user_id,
    user_email: newUser[0].user_email,
    user_full_name: newUser[0].user_full_name,
    role_id: newUser[0].role_id,
    token,
  }
  // res.json({ ...result, success: !!result.affectedRows });
  res.json({
    success: !!affectedRows,
    error: {
      issues: [],
    },
  });
});


export default router;
