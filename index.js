import express from "express";
import cors from "cors";
import products from "./routes/products.js";
// import 自己放在routes的js檔案

const app = express();

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    callback(null, true);
  },
};

// top middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use自己import的檔案跟導入的變數名
app.use("/products", products);
//app.use("/divesite", divesite);
//app.use("/diary", diary);
//app.use("/lesson", lesson);
//app.use("/member", member);
//app.use("/blog", blog);

// 監聽server 放在最尾部
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
  console.log(`server正在監聽port ${port}`);
});
