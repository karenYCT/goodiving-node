import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.js';
import memberProfile from "./routes/profile.js";
import jwt from "jsonwebtoken";



const app = express();


// ************* 頂層的 middlewares *************
const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      // console.log({ origin });
      callback(null, true);
    },
  };
  app.use(cors(corsOptions));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  

// ************* 自訂的頂層 middleware *************

app.use((req, res, next) => {
    let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer " === 0)){
    let token = auth.slice(7);
    try{
      req.user_jwt = jwt.verify(token, process.env.JWT_KEY)
    }catch(ex){
      console.log(ex)
    }
  }
next();
})


// 路由定義, callback 為路由處理器
// 路由的兩個條件: 1. HTTP method; 2. 路徑
app.get('/', (req, res,)=>{
    res.send('Hello World!');
})

app.use('/auth', authRoutes);
app.use('/profile', memberProfile);




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
