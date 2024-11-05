import express from 'express';
import cors from 'cors';
import db from './utils/connect-mysql.js';
import blog from "./routes/blog.js";
import message from "./routes/message.js";

const app = express();
const corsOptions = {   
    credentials: true,
    origin: (origin, callback) => {
      // console.log({ origin });
    callback(null, true);
    },
};



// ************* 頂層的 middlewares *************
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
// 要發的 api路徑 http://localhost:3001/api/blog
app.use("/api/blog", blog);
app.use("/api/message", message);
// ************* 自訂的頂層 middleware *************


// 測試路由
app.get('/test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 as test');
        res.json({ 
            message: '資料庫連線成功',
            data: rows 
        });
    } catch (error) {
        console.error('資料庫連線錯誤：', error);
        return res.status(500).json({ error: '資料庫連線失敗' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`服務器運行在 port ${PORT}`);
});




//************放靜態內容資料夾的位置************