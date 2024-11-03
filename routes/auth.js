// 登入、登出、註冊相關的路由

import express from 'express';
import db from '../utils/connect-mysql.js';
import upload from '../utils/upload.js';


const router = express.Router();


// 登入的邏輯
router.post('/login', upload.none(), async(req, res) =>{
    //回應給前端的訊息
    const output = {
        success: false,
        code: 0,
        error: "",
        bodyData: req.body,
    }
    let {email, password} = req.body;

    // 帳密是否都有值
    if(!email || !password){
        output.code =100;
        return res.json(output);
    }
    

    // 帳號是不是對的(是否有找到帳號)
    const sqlFindEmail = `SELECT * FROM user WHERE user_email = ?`
    const [rows] = await db.query(sqlFindEmail, [email]);
    console.log(rows[0]);
    if (!rows.length){
        output.code =400;
        output.error="帳號或密碼錯誤"
        return res.json(output);
    }


    // 密碼是不是對的
    if(rows[0].user_password !== password){
        output.code =450;
        output.error="帳號或密碼錯誤"
        return res.json(output);
    }
    // 等註冊使用加密的密碼時，要改成：
    //const result = await bcrypt.compare(password, row.password_hash);
    //if (!result) {...}



    // 如果帳號密碼都正確
    req.session.user = {
        user_id: rows[0].user_id,
        user_email: rows[0].user_email,
        user_full_name: rows[0].user_full_name,
        role_id: rows[0].role_id,
    };
    console.log(req.session);

    output.success = true;
    output.message = "登入成功";
    res.json(output);
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