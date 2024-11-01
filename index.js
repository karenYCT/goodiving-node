import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.js';
import memberProfile from "./routes/profile.js";
import bcrypt from "bcrypt";


const app = express();
const urlencodedParser = express.urlencoded({ extended: true });

// ************* 頂層的 middlewares *************
const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      // console.log({ origin });
      callback(null, true);
    },
  };
  app.use(cors(corsOptions));

  app.use(express.urlencodedParser({extended: true}));

// ************* 自訂的頂層 middleware *************



// 路由定義, callback 為路由處理器
// 路由的兩個條件: 1. HTTP method; 2. 路徑
app.get('/', (req, res)=>{
    res.send('Hello World!');
})

app.use('/auth', authRoutes);
app.use('/profile', memberProfile);


// 製造hash的路由
app.get("/bcrypt",async(req, res)=>{
    const pw = "123456";
    const hash = await bcrypt.hash(pw,12)

    res.send(hash);
})

// 比對hash的路由
app.get("/bcrypt2", async(req, res)=>{
    const hash = "$2b$12$7qAgMibqz6p4pkryTTG9lOUlR6rIzg6g1AIlAuHMjSTxEOwRDL8C2"
    const pw = "123456";
    const result = await bcrypt.compare(pw, hash);  // result 是 boolean
    
    res.json({result});
})


// *************  靜態內容資料夾e ************* 


//*************  404 頁面要在所有的路由後面  ************* 

app.use((req, res) => {
//   res.status(404).send("<h1>走錯路了</h1>");
  res.status(404).json({ msg: "走錯路了" });
});

const port = process.env.WEB_PORT || 3002;
app.listen(port, function () {
    console.log(`啟動 server 偵聽埠號 ${port}`); 
});
