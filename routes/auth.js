// 登入、登出、註冊相關的路由

import express from 'express';
import db from '../utils/connect-mysql.js';
import upload from "../utils/upload.js";

const router = express.Router();




// 登入的邏輯
router.post('/login',upload.none(), async(req, res) =>{
    //回應給前端的訊息
    const output = {
        success: false,
        code: 0,
        error: "",
        bodyData: req.body,
    }
    // let {email, password} = req.body;

    // 帳密都有值
    // if (!email || !password){
    //     return res.json(output);
    // }
    
    // 帳號是不是對的(有找到帳號)
    // const sql =`SELECT * FROM user WHERE user_email = ?`
    // const [rows] = await db.query(sql, [email]);


    // 密碼是不是對的

    res.send("登入成功");
});

router.post("/logout", (req, res)=>{
    // 登出的邏輯
    res.send("已登出");
});

router.post('/register', (req, res) => {
    // 處理註冊邏輯
    res.send('註冊成功');
  });

  export default router;