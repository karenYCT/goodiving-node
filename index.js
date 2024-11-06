import express from "express";
import cors from "cors";
import products from "./routes/products.js";
import cart from "./routes/cart.js";
import db from "./utils/connect-mysql.js";
import blog from "./routes/blog.js";
import message from "./routes/message.js";
import authRoutes from "./routes/auth.js";
import memberProfile from "./routes/profile.js";
import jwt from "jsonwebtoken";

// ************* 頂層的 middlewares *************
const app = express();
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // console.log({ origin });
    callback(null, true);
  },
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ************* 自訂的頂層 middleware *************
app.use((req, res, next) => {
  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer " === 0)) {
    let token = auth.slice(7);
    try {
      req.user_jwt = jwt.verify(token, process.env.JWT_KEY);
    } catch (ex) {
      console.log(ex);
    }
  }
  next();
});

// app.use自己import的檔案跟導入的變數名
app.use("/products", products);
app.use("/cart", cart);
//app.use("/divesite", divesite);
//app.use("/diary", diary);
//app.use("/lesson", lesson);
//app.use("/member", member);
app.use("/api/blog", blog);
app.use("/api/message", message);
app.use("/auth", authRoutes);
app.use("/profile", memberProfile);

// 測試路由
app.get("/test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 as test");
    res.json({
      message: "資料庫連線成功",
      data: rows,
    });
  } catch (error) {
    console.error("資料庫連線錯誤：", error);
    return res.status(500).json({ error: "資料庫連線失敗" });
  }
});

//************放靜態內容資料夾的位置************

//*************  404 頁面要在所有的路由後面  *************
app.use((req, res) => {
  //   res.status(404).send("<h1>走錯路了</h1>");
  res.status(404).json({ msg: "走錯路了" });
});

// 監聽server 放在最尾部
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
  console.log(`server正在監聽port ${port}`);
});
