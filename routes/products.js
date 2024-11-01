import express from "express";
import db from "../utils/connect-sql.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const sql = "SELECT * FROM product_list";
  const [rows] = await db.query(sql);
  res.json(rows);
});

export default router;
