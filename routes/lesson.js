import db from "../utils/connect-sql.js";
const router = express.Router();
import moment from "moment-timezone";
import express from "express";

router.get("/", async (req, res) => {
  res.locals.title = "goodiving - " + res.locals.title;
  res.locals.pageName = "搜尋課程";
  const perPage = 10; // 每頁最多顯示幾筆
  let page = parseInt(req.query.page) || 1;

  // 取得篩選與排序參數
  const { loc, date, type, dept, exp, gender, sort } = req.query;
  const params = [];

  // 主查詢
  let sql = `
    SELECT lr.round_id, lr.lesson_id, lr.coach_id, lr.lesson_loc_id, lr.round_start, lr.round_end, lr.round_price, lr.round_quota, l.lesson_name, l.lesson_name_zh, l.lesson_img_a, c.coach_name, c.coach_sex, c.coach_img, c.coach_rate, c.coach_exp, lt.lesson_type, cd.cert_dept, ll.lesson_loc
    FROM lesson_round lr
    JOIN lesson l ON lr.lesson_id = l.lesson_id
    JOIN coach c ON lr.coach_id = c.coach_id
    JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
    JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
    JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
    WHERE 1=1
  `;

  // 加入篩選條件
  if (loc) {
    sql += " AND lr.lesson_loc_id = ?";
    params.push(loc);
  }

  if (date) {
    sql += " AND lr.round_start >= ?";
    params.push(date);
  }

  if (type) {
    sql += " AND l.lesson_type_id = ?";
    params.push(type);
  }

  // TODO: 以下同一個分類無法複選
  if (dept) {
    sql += " AND l.cert_dept_id = ?";
    params.push(dept);
  }

  if (exp) {
    sql += " AND c.coach_exp >= ?";
    params.push(exp);
  }

  if (gender) {
    sql += " AND c.coach_sex = ?";
    params.push(gender);
  }

  // 加入排序條件
  if (sort) {
    if (sort === "date_asc") {
      sql += " ORDER BY lr.round_start ASC";
    } else if (sort === "date_desc") {
      sql += " ORDER BY lr.round_start DESC";
    } else if (sort === "price_asc") {
      sql += " ORDER BY lr.round_price ASC";
    } else if (sort === "price_desc") {
      sql += " ORDER BY lr.round_price DESC";
    } else if (sort === "rate_asc") {
      sql += " ORDER BY c.coach_rate ASC";
    } else if (sort === "rate_desc") {
      sql += " ORDER BY c.coach_rate DESC";
    }
  } else {
    sql += " ORDER BY lr.round_start ASC"; // 預設按日期升序排序
  }

  // 加入分頁條件
  sql += ` LIMIT ${(page - 1) * perPage}, ${perPage}`;

  try {
    // 計算符合條件的總筆數
    const countSql =
      `
      SELECT COUNT(1) AS totalRows 
      FROM lesson_round lr
      JOIN lesson l ON lr.lesson_id = l.lesson_id
      JOIN coach c ON lr.coach_id = c.coach_id
      JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
      JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
      JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
      WHERE 1=1
    ` + sql.slice(sql.indexOf("AND"), sql.indexOf("ORDER BY")); // 重用篩選條件

    const [[{ totalRows }]] = await db.query(countSql, params);
    const totalPages = Math.ceil(totalRows / perPage);

    // 查詢符合條件的資料
    const [rows] = await db.query(sql, params);

    rows.forEach((el) => {
      const s = moment(el.round_start);
      el.round_start = s.isValid() ? s.format("YYYY/MM/DD") : "";
      const e = moment(el.round_end);
      el.round_end = e.isValid() ? e.format("YYYY/MM/DD") : "";
    });

    res.json({ totalRows, totalPages, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 取得單一產品資料
router.get("/:round_id", async (req, res) => {
  const { round_id } = req.params;
  try {
    // 查詢產品基本資料
    const sql = `
    SELECT lr.round_id, lr.lesson_id, lr.coach_id, lr.lesson_loc_id, lr.round_start, lr.round_end, lr.round_price, lr.round_quota, l.lesson_name, l.lesson_name_zh, l.lesson_intro, l.lesson_group, l.lesson_content, l.lesson_process, l.lesson_contain, l.lesson_notice, l.lesson_img_a, l.lesson_img_b, l.lesson_img_c, l.lesson_img_d, l.lesson_img_e, c.coach_name, c.coach_img, c.coach_intro, c.coach_rate, c.coach_exp, lt.lesson_type, cd.cert_dept, ll.lesson_loc, cert.cert_dept, cert.cert_name
    FROM lesson_round lr
    JOIN lesson l ON lr.lesson_id = l.lesson_id
    JOIN coach c ON lr.coach_id = c.coach_id
    JOIN lesson_loc ll ON lr.lesson_loc_id = ll.lesson_loc_id
    JOIN lesson_type lt ON l.lesson_type_id = lt.lesson_type_id
    JOIN cert_dept cd ON l.cert_dept_id = cd.cert_dept_id
    JOIN cert_ref cr ON c.coach_id = cr.coach_id
    JOIN cert ON cr.cert_id = cert.cert_id
    WHERE round_id = ?`;
    const [rows] = await db.query(sql, [round_id]);

    res.json({ rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
